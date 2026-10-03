import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Diagnostic & Status Justification Endpoint for Plastic Extruder & QC
app.post('/api/qc-ai-diagnostic', async (req, res) => {
  try {
    const { report } = req.body;

    if (!report) {
      return res.status(400).json({ error: 'Report data is required.' });
    }

    const { header, criticalDimensions = [], production, defects = [] } = report;

    const promptContext = `
Analisis data inspeksi Quality Control (QC) untuk mesin ekstrusi lembaran plastik (Plastic Sheet Extruder) PT Camiloplas Jaya Makmur:

INFORMASI UMUM:
- Nama Modul: Inspector Quality
- Perusahaan: PT Camiloplas Jaya Makmur
- Mesin: ${header.machineName || 'Mesin Extruder'}
- Operator: ${header.operatorName || '-'}
- Bahan/Material: ${header.materialGrade || 'HIPS / PET / PP'}
- Tujuan Produksi: ${header.destinationPlant === 'PROSES_2_BOLANG' ? 'Proses 2 Pabrik Bolang (Tigaraksa)' : 'Proses 2 Pabrik Jati (Jatiuwung)'}
- Nomor Lot: ${header.partNumber || '-'}

DATA PRODUKSI:
- Total OK: ${production?.totalOk || 0} roll
- Total Roll Hold (Reject): ${production?.totalNg || 0} roll
- Total Rework: ${production?.totalRework || 0} roll
- Total Produksi: ${production?.totalProduced || 0} roll
- Rejection Rate: ${production?.rejectionRatePct?.toFixed(2) || '0'}% (Batas Maksimal: ${production?.rejectionThresholdFail || 3.5}%)

PENGUKURAN DIMENSI KRITIS (MICROMETER / SPC):
${criticalDimensions
  .map(
    (d: any, idx: number) =>
      `#${idx + 1} ${d.parameterName} [Alat: ${d.toolUsed}]: Nominal ${d.nominal} mm, LSL ${d.lowerSpecLimit} mm, USL ${d.upperSpecLimit} mm. Sampel S1-S5: [${(d.samples || []).join(', ')}]. Mean: ${d.mean ?? '-'}, Range: ${d.range ?? '-'}. Status: ${d.isAllInSpec ? 'IN-SPEC' : 'OUT-OF-SPEC'}`
  )
  .join('\n')}

DEFECT / TEMUAN CACAT (JIKA ADA):
${defects.filter((d: any) => d.count > 0).map((d: any) => `- ${d.name} (${d.indonesianName}): ${d.count} pcs (${d.severity})`).join('\n') || 'Tidak ada defect visual dilaporkan.'}

TUGAS ANDA SEBAGAI PAKAR TEKNOLOGI MESIN EKSTRUSI PLASTIK & SISTEM MUTU ISO PT CAMILOPLAS JAYA MAKMUR:
1. Analisis di mana letak kerusakan / akar masalah fisik pada mesin extruder (misalnya: baut die lip zona tertentu terlalu rapat/longgar, suhu chill roll kalender tidak seragam, screen changer / filter tersumbat, fluktuasi putaran screw extruder, atau kelembaban resin).
2. Berikan rekomendasi status yang tegas: apakah lot roll sheet ini sebaiknya DILOLOSKAN (PASS), LOLOS BERSYARAT DENGAN REWORK (CONDITIONAL_PASS), atau DITAHAN/REJECT (REJECT).
3. Berikan saran langkah tindakan korektif nyata yang harus dilakukan oleh operator atau teknisi mesin extruder di lapangan.
4. Sertakan wawasan pembelajaran teknis mengenai prinsip kerja mesin extruder plastik untuk menambah wawasan tim produksi dan QC.
5. Buat justifikasi formal yang siap disalin ke kolom Catatan QC & CAPA laporan.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptContext,
      config: {
        systemInstruction:
          'Anda adalah Kepala Rekayasa Ekstrusi Polimer dan Lead Auditor Mutu QC PT Camiloplas Jaya Makmur. Anda memiliki pemahaman mendalam tentang mekanika mesin extruder lembaran plastik (barrel zones, screw speed, gear pump, die lip thermal bolts, 3-roll chill roll stack, edge trim, haul-off, winder) dan kontrol kualitas lembaran plastik HIPS, PET, PP, dan PVC.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendationStatus: {
              type: Type.STRING,
              description: 'Status keputusan: PASS, CONDITIONAL_PASS, atau REJECT',
            },
            recommendationTitle: {
              type: Type.STRING,
              description: 'Judul rekomendasi singkat, e.g. "LOT LAYAK DILOLOSKAN KE PROSES 2"',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Tingkat keyakinan analisis dalam persen (0-100)',
            },
            rootCauseLocation: {
              type: Type.STRING,
              description: 'Komponen fisik spesifik pada mesin extruder yang menjadi akar masalah (e.g. "Baut Die Lip Zona Sisi Kiri (Baut #1-#3)", "Chill Roll Kalender #2", "Mesh Screen Changer")',
            },
            machineAnalysis: {
              type: Type.STRING,
              description: 'Penjelasan teknis mendalam tentang apa yang sedang terjadi di dalam mesin extruder yang menyebabkan variasi dimensi atau cacat.',
            },
            operatorActionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Langkah-langkah perbaikan praktis untuk operator mesin extruder di lantai produksi.',
            },
            extruderKnowledgeTip: {
              type: Type.STRING,
              description: 'Edukasi dan prinsip ilmiah mesin ekstrusi plastik terkait kasus ini agar tim belajar dan memahami perilaku mesin.',
            },
            formalJustification: {
              type: Type.STRING,
              description: 'Paragraf justifikasi formal untuk dimasukkan ke Catatan QC dan CAPA laporan.',
            },
          },
          required: [
            'recommendationStatus',
            'recommendationTitle',
            'confidenceScore',
            'rootCauseLocation',
            'machineAnalysis',
            'operatorActionSteps',
            'extruderKnowledgeTip',
            'formalJustification',
          ],
        },
      },
    });

    const resultJson = JSON.parse(response.text || '{}');
    return res.json(resultJson);
  } catch (error: any) {
    console.error('Error generating QC AI Diagnostic:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan diagnosa AI. Silakan coba lagi.',
    });
  }
});

// Production or Vite development middleware setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Inspector Quality server running on port ${port}`);
  });
}

startServer();
