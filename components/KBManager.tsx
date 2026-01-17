import React, { useState } from 'react';
import { Category, KBFile } from '../types';
import { ICONS } from '../constants';
import mammoth from 'mammoth';

interface KBManagerProps {
  files: KBFile[];
  onUpload: (files: KBFile[]) => void;
  onDelete: (id: string) => void;
}

// 💡 第一步：更新这里的分类定义，确保和 types.ts 一致
const CATEGORIES = [
  { id: Category.ORIGINAL, label: '原著剧本', icon: ICONS.FileText, color: 'blue' },
  { id: Category.LAYOUT_REF, label: '剧情脚本排版参考', icon: ICONS.Settings, color: 'emerald' },
  { id: Category.OUTLINE_REF, label: '剧情大纲写法参考', icon: ICONS.Library, color: 'amber' },
];

const KBManager: React.FC<KBManagerProps> = ({ files, onUpload, onDelete }) => {
  // 💡 第二步：初始化选择为“原著剧本”
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ORIGINAL);
  const [dragging, setDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const uploadedFiles = Array.from(e.dataTransfer.files) as File[];
    processFiles(uploadedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files) as File[]);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (file.name.endsWith('.docx')) {
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (err) {
            reject(new Error(`无法解析 DOCX: ${file.name}`));
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error(`读取文件失败: ${file.name}`));
        reader.readAsText(file);
      }
    });
  };

  const processFiles = async (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    setIsProcessing(true);
    try {
      const processedFiles: KBFile[] = await Promise.all(
        rawFiles.map(async (file) => {
          const content = await readFileContent(file);
          return {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            category: selectedCategory, // 💡 这里会自动带上你在左侧选中的分类
            content: content,
            uploadDate: new Date().toLocaleString(),
          };
        })
      );
      onUpload(processedFiles);
    } catch (error) {
      alert("批量解析部分文件失败，请检查格式。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex bg-slate-50/50">
      {/* Category Nav Sidebar */}
      <aside className="w-80 border-r border-slate-200/60 p-8 flex flex-col gap-10">
        <div>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">资源档案库</h2>
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                  selectedCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-xl translate-x-2' 
                  : 'text-slate-500 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${selectedCategory === cat.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-900'}`}>
                    {cat.icon}
                  </div>
                  <span className="font-bold text-sm tracking-tight">{cat.label}</span>
                </div>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {files.filter(f => f.category === cat.id).length}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="relative z-10">
            <h3 className="font-black text-lg mb-2">智能作业指引</h3>
            <p className="text-xs text-blue-100 leading-relaxed opacity-90">
              请先在上方选择分类，再进行上传。系统会自动根据分类在工作台提供不同的 AI 生成建议。
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-20 scale-150 transform rotate-12">
            {ICONS.Library}
          </div>
        </div>
      </aside>

      {/* Content Gallery */}
      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Large Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            className={`relative border-2 border-dashed rounded-[3rem] p-20 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
              dragging ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-slate-200 bg-white shadow-sm hover:border-slate-300'
            }`}
          >
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-5">
                <div className="w-14 h-14 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="font-black text-xl text-slate-900">数据同步中...</p>
                  <p className="text-sm text-slate-400">正在提取文档文本并部署至因果律引擎</p>
                </div>
              </div>
            )}

            <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center mb-8 transition-all duration-700 ${
              dragging ? 'bg-blue-600 text-white rotate-12' : 'bg-slate-50 text-slate-300'
            }`}>
              <div className="scale-[2]">{ICONS.Upload}</div>
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">导入【{selectedCategory}】</h3>
              <p className="text-slate-400 font-medium">拖拽 Docx 或 Txt 到此处，系统将自动标记分类</p>
            </div>

            <label className="mt-10 cursor-pointer group">
              <span className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl group-hover:bg-black active:scale-95 flex items-center gap-3">
                选择本地文件
                {ICONS.ChevronRight}
              </span>
              <input type="file" multiple className="hidden" onChange={handleFileInput} />
            </label>
          </div>

          {/* Files Grid */}
          <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
                  {ICONS.Folder}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">已就绪资源</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Assets Deployment</p>
                </div>
              </div>
              <div className="px-5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">
                当前库存: <span className="text-slate-900">{files.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {files.map(file => {
                const catInfo = CATEGORIES.find(c => c.id === file.category);
                return (
                  <div key={file.id} className="group bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-2xl hover:border-blue-100 transition-all duration-500 relative animate-fade-up">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl bg-${catInfo?.color || 'slate'}-50 text-${catInfo?.color || 'slate'}-600`}>
                        {catInfo?.icon}
                      </div>
                      <button 
                        onClick={() => onDelete(file.id)}
                        className="text-slate-200 hover:text-rose-500 p-2 rounded-xl transition-colors"
                      >
                        {ICONS.Trash}
                      </button>
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 text-lg leading-tight line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
                        {file.name}
                      </h5>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border border-slate-100 text-slate-400 uppercase tracking-wider`}>
                          {file.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">{file.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {files.length === 0 && (
                <div className="col-span-full py-40 bg-white/40 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-6">
                  <div className="opacity-10 scale-[3]">{ICONS.Library}</div>
                  <p className="text-xl font-bold">知识库暂无存量，请先导入资料源</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KBManager;
