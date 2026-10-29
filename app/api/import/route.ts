import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import * as xlsx from 'xlsx';

// Inicialización del cliente de Notion
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Transformador de fechas (soporta número de Excel y texto en español)
function parseExcelDate(dateVal: any): string | null {
  if (!dateVal) return null;

  if (typeof dateVal === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + dateVal * 86400000);
    return date.toISOString();
  }

  const str = String(dateVal).trim();
  const meses: { [key: string]: string } = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
  };

  const regex = /(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/i;
  const match = str.match(regex);

  if (match) {
    const [, day, monthStr, year, hour, minute] = match;
    const month = meses[monthStr.toLowerCase()];
    if (month) {
      const paddedDay = day.padStart(2, '0');
      if (hour && minute) {
        const paddedHour = hour.padStart(2, '0');
        return `${year}-${month}-${paddedDay}T${paddedHour}:${minute}:00.000-03:00`;
      }
      return `${year}-${month}-${paddedDay}`;
    }
  }

  const nativeDate = new Date(str);
  if (!isNaN(nativeDate.getTime())) return nativeDate.toISOString();

  return null;
}

// Pausa para respetar el rate limit de Notion (máx ~3 peticiones por segundo)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    if (!process.env.NOTION_TOKEN || !DATABASE_ID) {
      return NextResponse.json(
        { error: 'Variables de entorno NOTION_TOKEN o NOTION_DATABASE_ID no configuradas en el servidor.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const crmId = formData.get('crmId') as string;
    const pais = formData.get('pais') as string;
    const producto = formData.get('producto') as string;
    const modalidad = formData.get('modalidad') as string;
    const cliente = formData.get('cliente') as string;
	const gestor = formData.get('gestor') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    // Lectura del archivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames.includes('Tabla_Tareas1')
      ? 'Tabla_Tareas1'
      : workbook.SheetNames[0];

    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    let rowsImported = 0;

    for (const row of data as any[]) {
      // Ignorar filas sin identificador o título
      if (!row['Id'] && !row['Nombre']) continue;

      const startIso = parseExcelDate(row['Comienzo']);
      const endIso = parseExcelDate(row['Fin']);
	  const startReal = parseExcelDate(row['Comienzo_real']);
      const endLB = parseExcelDate(row['Fin_de_línea_base']);

      // Construcción del objeto de propiedades según esquema de Notion
      const properties: Record<string, any> = {
        "CRM": { 
          title: [{ text: { content: crmId || 'Sin CRM ID' } }] 
        },
        "Id Tarea": { 
          number: Number(row['Id']) || null 
        },
        "Nombre Tarea": { 
          rich_text: [{ text: { content: String(row['Nombre'] || '') } }] 
        },
        "Porcentaje Completado": { 
          number: Number(row['Porcentaje_completado']) || 0 
        },
		"Porcentaje Av Esperado": { 
          number: Number(row['Porcentaje_Av_Esperado']) || 0 
        },
		"Predecesoras": { 
          number: Number(row['Predecesoras']) || 0 
        },
        "Duración": { 
          rich_text: [{ text: { content: String(row['Duración'] || '') } }] 
        },
        "Recursos": { 
          rich_text: [{ text: { content: String(row['Nombres_de_los_recursos'] || '') } }] 
        }
      };
	  
	  if (gestor) properties["Gestor"] = { select: { name: gestor } };
      if (pais) properties["País"] = { select: { name: pais } };
      if (producto) properties["Producto"] = { select: { name: producto } };
      if (modalidad) properties["Modalidad"] = { select: { name: modalidad } };
      if (cliente) properties["Cliente"] = { select: { name: cliente } };
      if (startIso) properties["Comienzo"] = { date: { start: startIso } };
	  if (startReal) properties["Comienzo Real"] = { date: { start: startReal } };
      if (endIso) properties["Fin"] = { date: { start: endIso } };
	  if (endLB) properties["Fin Linea Base"] = { date: { start: endLB } };
	  
      try {
        await notion.pages.create({
          parent: { database_id: DATABASE_ID },
          properties: properties,
        });

        rowsImported++;
        await delay(350);
      } catch (rowError: any) {
        console.error(`Error en fila ${row['Id']}:`, rowError.body || rowError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se importaron ${rowsImported} tareas exitosamente.`,
    });
  } catch (error: any) {
    console.error('Error global al procesar:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}