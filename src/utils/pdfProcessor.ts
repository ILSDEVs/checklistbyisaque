import { ProcessingFile } from "@/components/ProcessingStatus";

interface FileWithId extends File {
  id: string;
}

// Coordenadas padrão para busca do número de série (canto superior esquerdo)
const DEFAULT_COORDINATES = {
  x: 50,      // pixels do lado esquerdo
  y: 50,      // pixels do topo
  width: 200, // largura da área de busca
  height: 100 // altura da área de busca
};

// Simula a extração do número de série do PDF usando coordenadas específicas
const extractSerialNumberFromPDF = async (file: File): Promise<string | null> => {
  // Simula tempo de processamento de leitura do PDF
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
  
  console.log(`Processando arquivo: ${file.name}`);
  console.log(`Buscando número de série nas coordenadas: x=${DEFAULT_COORDINATES.x}, y=${DEFAULT_COORDINATES.y}`);
  
  // Regex para o padrão 1X000000X
  const serialPattern = /\b1[A-Z][0-9]{6}[A-Z]\b/;
  
  // Simula diferentes cenários de processamento baseado no nome do arquivo
  const fileName = file.name.toLowerCase();
  
  // Simula PDF corrompido ou com erro
  if (fileName.includes('corrupt') || fileName.includes('erro')) {
    throw new Error('Arquivo PDF corrompido ou ilegível');
  }
  
  // Simula PDF protegido por senha
  if (fileName.includes('protect') || fileName.includes('senha')) {
    throw new Error('PDF protegido por senha');
  }
  
  // Simula leitura por coordenadas específicas
  console.log(`Lendo área específica: ${DEFAULT_COORDINATES.width}x${DEFAULT_COORDINATES.height}px`);
  
  // Simula OCR na área especificada
  if (fileName.includes('scan') || fileName.includes('imagem')) {
    console.log('Aplicando OCR na área delimitada...');
    // Simula tentativa de OCR em área específica
    if (Math.random() > 0.5) {
      throw new Error('OCR falhou na área especificada - texto não reconhecido');
    }
  }
  
  // Simula busca de texto na área de coordenadas
  const coordenateSearchSuccess = Math.random() > 0.15; // 85% de chance de sucesso com coordenadas
  
  if (coordenateSearchSuccess) {
    // Gera um número de série fictício seguindo o padrão correto
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters[Math.floor(Math.random() * letters.length)];
    const lastLetter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const serialNumber = `1${firstLetter}${numbers}${lastLetter}`;
    
    console.log(`Número de série encontrado nas coordenadas: ${serialNumber}`);
    return serialNumber;
  }
  
  // Tenta busca em coordenadas alternativas (centro superior)
  const alternateCoords = { x: 200, y: 80, width: 250, height: 120 };
  console.log(`Tentando coordenadas alternativas: x=${alternateCoords.x}, y=${alternateCoords.y}`);
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simula nova busca
  
  const alternateSearchSuccess = Math.random() > 0.3; // 70% chance na segunda tentativa
  
  if (alternateSearchSuccess) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters[Math.floor(Math.random() * letters.length)];
    const lastLetter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const serialNumber = `1${firstLetter}${numbers}${lastLetter}`;
    
    console.log(`Número de série encontrado em coordenadas alternativas: ${serialNumber}`);
    return serialNumber;
  }
  
  console.log('Número de série não encontrado em nenhuma área de coordenadas');
  return null;
};

export const processFiles = async (
  files: FileWithId[],
  onProgress: (files: ProcessingFile[]) => void
): Promise<ProcessingFile[]> => {
  const processingFiles: ProcessingFile[] = files.map(file => ({
    id: file.id,
    name: file.name,
    status: 'pending'
  }));

  // Inicia o processamento
  onProgress(processingFiles);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const processingFile = processingFiles[i];
    
    // Marca como processando
    processingFile.status = 'processing';
    onProgress([...processingFiles]);
    
    try {
      const serialNumber = await extractSerialNumberFromPDF(file);
      
      if (serialNumber) {
        processingFile.status = 'success';
        processingFile.serialNumber = serialNumber;
        processingFile.newName = `${serialNumber}.pdf`;
      } else {
        processingFile.status = 'error';
        processingFile.errorReason = 'Número de série não encontrado no padrão 1X000000X';
      }
    } catch (error) {
      processingFile.status = 'error';
      processingFile.errorReason = error instanceof Error ? error.message : 'Erro desconhecido durante processamento';
    }
    
    onProgress([...processingFiles]);
  }
  
  return processingFiles;
};

export const generateZipFile = (files: ProcessingFile[]): void => {
  // Simula a geração do arquivo ZIP
  const successFiles = files.filter(f => f.status === 'success');
  
  // Cria um blob simulado para download
  const zipContent = `Arquivo ZIP simulado contendo ${successFiles.length} arquivos:\n\n` +
    successFiles.map(f => `${f.newName} (original: ${f.name})`).join('\n');
  
  const blob = new Blob([zipContent], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `checklists_renomeados_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
};

export const generateReport = (files: ProcessingFile[]): void => {
  // Gera relatório em formato CSV
  const headers = ['Nome Original', 'Status', 'Número de Série', 'Novo Nome', 'Motivo do Erro'];
  const rows = files.map(f => [
    f.name,
    f.status === 'success' ? 'Processado' : 'Erro',
    f.serialNumber || '-',
    f.newName || '-',
    f.errorReason || '-'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_processamento_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
};