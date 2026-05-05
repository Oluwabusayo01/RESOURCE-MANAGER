import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onChange: (file: File | null) => void
}

export default function FileUploader({ onChange }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]

  const validateFile = (file: File) => {
    if (allowedTypes.includes(file.type)) {
      setFile(file)
      onChange(file)
      return true
    } else {
      alert('Only PDF, DOCX, and PPTX files are allowed.')
      return false
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateFile(droppedFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateFile(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer text-center",
          isDragging ? "border-gold bg-gold/5" : "border-mid-gray bg-light-gray hover:border-gold",
          file ? "border-solid border-green-500 bg-green-50" : ""
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.docx,.pptx"
          className="hidden"
        />

        {!file ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className={cn("w-10 h-10 transition-colors", isDragging ? "text-gold" : "text-dark-gray")} />
            <p className="text-sm font-medium text-accent">
              Click or drag to upload study material
            </p>
            <p className="text-xs text-dark-gray">
              PDF, DOCX, or PPTX only
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-2">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-green-100 rounded">
                <FileText className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-accent truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-dark-gray">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
              className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
