import { ProcessingFile } from "@/components/ProcessingStatus";

interface FileWithId extends File {
  id: string;
  serialNumber?: string;
}

// Valida se o número de série está no formato correto: 1X000000X
const validateSerialNumber = (serialNumber: string): boolean => {
  const serialPattern = /^1[A-Z][0-9]{6}[A-Z]$/;
  return serialPattern.test(serialNumber);
};
// Processa arquivos usando os números de série inseridos manualmente
const processFileWithManualSerial = async (file: FileWithId): Promise<{ serialNumber?: string; errorReason?: string }> => {
  // Simula tempo de processamento
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  // Verifica se o número de série foi fornecido
  if (!file.serialNumber || file.serialNumber.trim() === '') {
    return { errorReason: 'Número de série não informado' };
  }
  
  // Valida o formato do número de série
  if (!validateSerialNumber(file.serialNumber.trim())) {
    return { errorReason: 'Formato de número de série inválido (use 1X000000X)' };
  }
  
  return { serialNumber: file.serialNumber.trim() };
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
      const result = await processFileWithManualSerial(file);
      
      if (result.serialNumber) {
        processingFile.status = 'success';
        processingFile.serialNumber = result.serialNumber;
        processingFile.newName = `${result.serialNumber}.pdf`;
      } else {
        processingFile.status = 'error';
        processingFile.errorReason = result.errorReason || 'Erro desconhecido';
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