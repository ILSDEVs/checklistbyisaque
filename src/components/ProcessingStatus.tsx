import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

export interface ProcessingFile {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  serialNumber?: string;
  errorReason?: string;
  newName?: string;
}

interface ProcessingStatusProps {
  files: ProcessingFile[];
  isProcessing: boolean;
}

export const ProcessingStatus = ({ files, isProcessing }: ProcessingStatusProps) => {
  const completedFiles = files.filter(f => f.status === 'success' || f.status === 'error').length;
  const totalFiles = files.length;
  const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-error" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Processado</Badge>;
      case 'error':
        return <Badge variant="error">Erro</Badge>;
      case 'processing':
        return <Badge variant="warning">Processando</Badge>;
      default:
        return <Badge variant="outline">Aguardando</Badge>;
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Processamento</h3>
          <span className="text-sm text-muted-foreground">
            {completedFiles} de {totalFiles} arquivos
          </span>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-center text-muted-foreground">
            {isProcessing ? "Processando arquivos..." : progress === 100 ? "Processamento concluído!" : "Pronto para processar"}
          </p>
        </div>
      </div>

      {/* Files Status List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-card border rounded-lg"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getStatusIcon(file.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                {file.status === 'success' && file.serialNumber && (
                  <p className="text-sm text-success">
                    → {file.serialNumber}.pdf
                  </p>
                )}
                {file.status === 'error' && file.errorReason && (
                  <p className="text-sm text-error">
                    {file.errorReason}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(file.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};