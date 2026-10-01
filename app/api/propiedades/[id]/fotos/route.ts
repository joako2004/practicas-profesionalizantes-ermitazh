import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verificar sesión de Supabase (mismo patrón que las otras rutas)
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    // 2. Verificar que la propiedad exista
    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id },
    });

    if (!propiedadExistente) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    // 3. Recibir los archivos del formulario (campo "fotos")
    const formData = await request.formData();
    const files = formData.getAll("fotos") as File[];

    // 4. Validar cada archivo antes de subirlo
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const validFiles: File[] = [];
    const errorFiles: Array<{ name: string; reason: string }> = [];

    for (const file of files) {
      // Validar tipo MIME
      if (!ALLOWED_TYPES.includes(file.type)) {
        errorFiles.push({
          name: file.name,
          reason: `Tipo de archivo "${file.type}" no está permitido. Solo se aceptan: ${ALLOWED_TYPES.join(
            ", "
          )}`,
        });
        continue;
      }

      // Validar tamaño máximo 5MB
      if (file.size > MAX_SIZE) {
        errorFiles.push({
          name: file.name,
          reason: `El archivo "${file.name}" excede el límite de 5MB`,
        });
        continue;
      }

      validFiles.push(file);
    }

    // Si hay errores de validación, responder 400
    if (errorFiles.length > 0) {
      return NextResponse.json(
        {
          error: "Errores de validación en algunos archivos",
          detalles: errorFiles,
        },
        { status: 400 }
      );
    }

    // Si no hay archivos válidos, responder 400
    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: "No hay archivos válidos para subir." },
        { status: 400 }
      );
    }

    // 5. Crear cliente de Supabase con SUPABASE_SERVICE_ROLE_KEY
    //    (permisos de escritura directos, sin depender de RLS del usuario)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 6. Subir cada archivo al bucket "propiedades-fotos"
    //    - Nombre único: id-propiedad + timestamp + uuid + extensión original
    //    - Si falla alguna subida, abortamos todo para evitar estado inconsistente
    const uploadPromises = validFiles.map(async (file) => {
      const extension = file.name.split(".").pop() || "jpg";
      const uniqueId = `${id}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const fileName = `${uniqueId}.${extension}`;
      const filePath = fileName;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("propiedades-fotos")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);
      }

      // Obtener URL pública del archivo subido
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("propiedades-fotos").getPublicUrl(filePath);

      return publicUrl;
    });

    // Esperar que terminen TODAS las subidas
    const nuevasUrls = await Promise.all(uploadPromises);

    // 7. Actualizar la propiedad con Prisma
    //    - Agregamos las nuevas URLs al array EXISTENTE (no reemplazamos)
    //    - Si alguna subida hubiera fallado, el throw anterior abortaría el flujo
    //      y nunca llegaríamos aquí (garantizando consistencia)
    const fotosActuales: string[] = propiedadExistente.fotos || [];
    const nuevasFotos = [...fotosActuales, ...nuevasUrls];

    const propiedadActualizada = await prisma.propiedad.update({
      where: { id },
      data: {
        fotos: nuevasFotos,
      },
    });

    // 8. Responder con la propiedad actualizada
    return NextResponse.json(propiedadActualizada, { status: 200 });
  } catch (error) {
    console.error("Error al subir fotos de la propiedad:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}