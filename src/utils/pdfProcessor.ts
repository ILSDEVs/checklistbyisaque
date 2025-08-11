import { ProcessingFile } from "@/components/ProcessingStatus";

interface FileWithId extends File {
  id: string;
}

// Simula a busca do número de série no PDF
const extractSerialNumber = async (file: File): Promise<string | null> => {
  // Simula tempo de processamento
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
  
  // Regex para o padrão 1X000000X
  const serialPattern = /\b1[A-Z][0-9]{6}[A-Z]\b/;
  
  // Simula diferentes cenários baseado no nome do arquivo
  const fileName = file.name.toLowerCase();
  
  // Simula encontrar números de série em alguns arquivos
  if (fileName.includes('checklist') || fileName.includes('test')) {
    // Gera um número de série fictício que segue o padrão
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters[Math.floor(Math.random() * letters.length)];
    const lastLetter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `1${firstLetter}${numbers}${lastLetter}`;
  }
  
  // Simula diferentes tipos de erro
  if (fileName.includes('corrupt')) {
    throw new Error('Arquivo corrompido');
  }
  if (fileName.includes('protected')) {
    throw new Error('PDF protegido por senha');
  }
  if (fileName.includes('scan')) {
    throw new Error('Arquivo ilegível - necessário OCR');
  }
  
  // 70% de chance de encontrar um número de série nos outros arquivos
  if (Math.random() > 0.3) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const firstLetter = letters[Math.floor(Math.random() * letters.length)];
    const lastLetter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `1${firstLetter}${numbers}${lastLetter}`;
  }
  
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
      const serialNumber = await extractSerialNumber(file);
      
      if (serialNumber) {
        processingFile.status = 'success';
        processingFile.serialNumber = serialNumber;
        processingFile.newName = `${serialNumber}.pdf`;
      } else {
        processingFile.status = 'error';
        processingFile.errorReason = 'Número de série não encontrado';
      }
    } catch (error) {
      processingFile.status = 'error';
      processingFile.errorReason = error instanceof Error ? error.message : 'Erro desconhecido';
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