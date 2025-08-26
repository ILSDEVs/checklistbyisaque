import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileWithId extends File {
  id: string;
}

interface FileUploadProps {
  onFilesChange: (files: FileWithId[]) => void;
  files: FileWithId[];
}

export const FileUpload = ({ onFilesChange, files }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => {
      // Preserva o objeto File original e apenas anexa o id (não espalhar!)
      const withId = Object.assign(file, {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }) as FileWithId;
      return withId;
    });
    onFilesChange([...files, ...newFiles]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(file => file.id !== fileId));
  };

  const clearAll = () => {
    onFilesChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? "Solte os arquivos aqui" : "Arrastar e soltar PDFs"}
        </h3>
        <p className="text-muted-foreground mb-4">
          ou clique para selecionar arquivos
        </p>
        <Button variant="secondary" size="sm">
          Selecionar Arquivos
        </Button>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">
              Arquivos Selecionados ({files.length})
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAll}
              className="text-error hover:text-error hover:border-error"
            >
              Limpar Todos
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-card border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-error" />
                  <div>
                    <p className="font-medium truncate max-w-sm">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-muted-foreground hover:text-error"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};