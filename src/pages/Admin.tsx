import React, { useState, useEffect, type FormEvent } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Briefcase,
  Image as ImageIcon,
  Calendar,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Newspaper,
  Compass,
  History,
  User as UserIcon,
  Mail,
  BarChart2,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
} from "lucide-react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import {
  getAboutInfo,
  updateAboutInfo,
  getProjects,
  getEvents,
  getNews,
  getVolunteers,
  getSurveys,
  getInquiries,
  getGallery,
  getBeneficiaries,
} from "../services/cmsService";

const FilePreviewItem = ({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: () => void;
  key?: any;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  useEffect(() => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="relative group p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          className="w-12 h-12 object-cover rounded-xl shadow-sm"
          alt="Preview"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
          <ImageIcon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-xs font-bold text-ngo-blue truncate">{file.name}</p>
        <p className="text-[10px] text-slate-400">
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove file"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const compressImage = (
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.82,
): Promise<File> => {
  return new Promise((resolve) => {
    // If file is already small (under 256KB), skip compression entirely
    if (file.size <= 256 * 1024) {
      resolve(file);
      return;
    }

    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                },
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

interface DragAndDropImageFieldProps {
  label: string;
  sublabel?: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  existingUrl?: string;
  onUrlChange?: (url: string) => void;
  placeholderUrl?: string;
}

const DragAndDropImageField = ({
  label,
  sublabel,
  selectedFile,
  onFileSelect,
  existingUrl,
  onUrlChange,
  placeholderUrl = "https://images.unsplash.com/...",
}: DragAndDropImageFieldProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview("");
    }
  }, [selectedFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  const hasImage = preview || existingUrl;

  return (
    <div className="space-y-2 font-sans">
      <div className="flex justify-between items-baseline px-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </label>
        {sublabel && (
          <span className="text-[9px] text-slate-400 italic">{sublabel}</span>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-200 overflow-hidden flex flex-col items-center justify-center min-h-[160px] p-6 text-center cursor-pointer group ${
          isDragOver
            ? "border-lemon bg-lemon/5 scale-[1.01]"
            : hasImage
              ? "border-slate-200 bg-white hover:border-lemon"
              : "border-slate-200 bg-slate-50 hover:border-lemon"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {hasImage ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 z-20">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white">
              <img
                src={preview || existingUrl}
                alt="Upload Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110"
              >
                <XCircle size={14} />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-ngo-blue truncate max-w-[250px]">
                {selectedFile
                  ? selectedFile.name
                  : "Using Existing Cover Image"}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : "Click or Drag to replace image"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <ImageIcon
                size={20}
                className="text-slate-400 group-hover:text-lemon transition-colors"
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-black text-ngo-blue">
                Drag & drop your image here
              </p>
              <p className="text-[10px] text-slate-400">
                or click to browse your files
              </p>
            </div>
          </div>
        )}
      </div>

      {onUrlChange && !selectedFile && (
        <div className="space-y-1 mt-2">
          <p className="text-[10px] text-slate-400 px-1 italic">
            Or enter image URL instead (optional)
          </p>
          <input
            type="text"
            placeholder={placeholderUrl}
            value={existingUrl || ""}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300 text-xs text-ngo-blue font-semibold"
          />
        </div>
      )}
    </div>
  );
};

interface GalleryFormProps {
  uploading: boolean;
  bulkUploads: any[];
  selectedFiles: File[];
  newItem: any;
  setNewItem: (item: any) => void;
  handleFilesSelected: (files: FileList | null) => void;
  removeFileFromQueue: (index: number) => void;
  setSelectedFiles: (files: File[]) => void;
  setBulkUploads: (uploads: any[]) => void;
  editingItem: any;
  projects?: any[];
  events?: any[];
}

const GalleryForm = ({
  uploading,
  bulkUploads,
  selectedFiles,
  newItem,
  setNewItem,
  handleFilesSelected,
  removeFileFromQueue,
  setSelectedFiles,
  setBulkUploads,
  editingItem,
  projects,
  events,
}: GalleryFormProps) => {
  return (
    <div className="space-y-6">
      {uploading ? (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6 font-sans">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-lemon/10 text-lemon rounded-full flex items-center justify-center mx-auto animate-pulse">
              <ImageIcon size={24} />
            </div>
            <h4 className="text-lg font-black text-ngo-blue">
              Uploading Gallery Media...
            </h4>
            <p className="text-xs text-slate-400">
              Processing{" "}
              {bulkUploads.filter((u) => u.status === "success").length} of{" "}
              {bulkUploads.length} files successfully.
            </p>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              <span>Overall Run Progress</span>
              <span>
                {bulkUploads.length > 0
                  ? Math.round(
                      (bulkUploads.reduce(
                        (sum, item) => sum + item.progress,
                        0,
                      ) /
                        (bulkUploads.length * 100)) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner font-sans">
              <div
                className="h-full bg-linear-to-r from-lemon to-ngo-blue transition-all duration-300"
                style={{
                  width: `${bulkUploads.length > 0 ? (bulkUploads.reduce((sum, item) => sum + item.progress, 0) / (bulkUploads.length * 100)) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* List of files with specific progress numbers */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            {bulkUploads.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ngo-blue truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        item.status === "success"
                          ? "bg-emerald-50 text-emerald-500"
                          : item.status === "failed"
                            ? "bg-rose-50 text-rose-500"
                            : item.status === "uploading"
                              ? "bg-blue-50 text-blue-500 animate-pulse"
                              : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.size && (
                      <span className="text-[10px] text-slate-400">
                        {(item.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    )}
                    {item.error && (
                      <span className="text-[10px] text-rose-500 font-medium truncate max-w-[200px]" title={item.error}>
                        ({item.error})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right w-16">
                  <span className="text-xs font-black text-ngo-blue">
                    {item.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Media Group / Title Prefix
            </label>
            <input
              required={selectedFiles.length === 0}
              type="text"
              placeholder="e.g. Field Visit Photos"
              value={newItem.title || ""}
              onChange={(e) =>
                setNewItem({ ...newItem, title: e.target.value })
              }
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300 text-sm"
            />
          </div>

          <div className="space-y-2 font-sans">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Associated Project (Optional)
            </label>
            <select
              value={newItem.projectId || ""}
              onChange={(e) => {
                const selectedProj = projects?.find(
                  (p: any) => p.id === e.target.value,
                );
                setNewItem({
                  ...newItem,
                  projectId: e.target.value,
                  projectTitle: selectedProj ? selectedProj.title : "",
                });
              }}
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-semibold text-ngo-blue"
            >
              <option value="">No Associated Project (General)</option>
              {projects?.map((proj: any) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 font-sans">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Event / Album Grouping (Optional)
            </label>
            <div className="space-y-2">
              <select
                value={newItem.eventId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setNewItem({
                      ...newItem,
                      eventId: "custom",
                      eventName: newItem.eventName || "",
                    });
                  } else {
                    const selectedEvt = events?.find((evt: any) => evt.id === val);
                    setNewItem({
                      ...newItem,
                      eventId: val,
                      eventName: selectedEvt ? selectedEvt.title : "",
                    });
                  }
                }}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-semibold text-ngo-blue"
              >
                <option value="">No Associated Event (General)</option>
                {events?.map((evt: any) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title}
                  </option>
                ))}
                <option value="custom">Type a custom event/album name...</option>
              </select>

              {newItem.eventId === "custom" && (
                <input
                  type="text"
                  placeholder="Type custom event or album name here..."
                  value={newItem.eventName || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, eventName: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300 text-sm animate-fade-in"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Upload Media (Drag & Drop / Bulk Supported)
            </label>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="relative p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <input
                type="file"
                multiple={!editingItem}
                accept="image/*,video/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <ImageIcon size={22} className="text-lemon" />
              </div>
              <div className="text-center font-sans">
                <p className="text-xs font-bold text-ngo-blue">
                  Drag & Drop files here or click to select
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports multiple images or videos up to 10MB each
                </p>
              </div>
            </div>

            {/* Preview Grid */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center px-1">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Selected Files ({selectedFiles.length})
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles([]);
                      setBulkUploads([]);
                    }}
                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 no-scrollbar animate-fade-in">
                  {selectedFiles.map((file, idx) => (
                    <FilePreviewItem
                      key={idx}
                      file={file}
                      index={idx}
                      onRemove={() => removeFileFromQueue(idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!editingItem && selectedFiles.length === 0 && (
              <div className="space-y-2 mt-4 font-sans">
                <p className="text-[10px] text-slate-400 px-1 italic">
                  Or enter Media URL manually (for external source)
                </p>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newItem.url || ""}
                  onChange={(e) =>
                    setNewItem({ ...newItem, url: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300 text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Type
            </label>
            <select
              value={newItem.type || "photo"}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-semibold"
            >
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Email/Password Authentication state
  const [authTab, setAuthTab] = useState<"google" | "email">("google");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailAuthError, setEmailAuthError] = useState("");
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState<any>({
    volunteers: [],
    surveys: [],
    projects: [],
    news: [],
    gallery: [],
    events: [],
    beneficiaries: [],
    inquiries: [],
    siteInfo: null,
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [bulkUploads, setBulkUploads] = useState<
    {
      name: string;
      progress: number;
      status: "pending" | "uploading" | "success" | "failed";
      size?: number;
      error?: string;
    }[]
  >([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [founderPhotoFile, setFounderPhotoFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const applyEventTemplate = (templateName: string) => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // 2 weeks in future
    const dateStr = today.toISOString().split("T")[0];

    const templates: Record<string, any> = {
      outreach: {
        title: "Community Outreach & Resource Distribution",
        location: "Karu Primary School Field Center, Abuja",
        description: "Join us in our upcoming community outreach campaign. We are distributing educational text/exercise books, writing materials, sanitary and wellness products, as well as basic nutritional supplies to underserved families.",
        time: "10:00 AM - 3:00 PM",
        date: dateStr,
      },
      workshop: {
        title: "Youth Vocational & Digital Skills Workshop",
        location: "Foundation Learning Hub, Abuja",
        description: "A practical learning session dedicated to empowering local youths with vocational skills and basic digital literacy. Mentors will be teaching basic computer operations, local business administration, and financial hygiene.",
        time: "09:00 AM - 1:00 PM",
        date: dateStr,
      },
      health: {
        title: "Primary Healthcare & Pediatric Support Camp",
        location: "Sinarimam Community Clinic, Abuja",
        description: "A comprehensive free health screening and consultation camp for local children and vulnerable families, staffed by certified volunteer medical officers. Offering basic pediatric checkups, nutritional supplements, and hygiene education.",
        time: "08:00 AM - 2:00 PM",
        date: dateStr,
      },
      gala: {
        title: "Sinarimam Annual Gala & Project Exhibition",
        location: "Ambassador Hall, Abuja",
        description: "An elegant evening celebrating our field accomplishments and listing upcoming milestones. Connecting with our amazing partners, board members, and volunteers. Featuring guest speeches, cultural performance, and project showcase.",
        time: "6:00 PM - 10:00 PM",
        date: dateStr,
      },
    };

    const selected = templates[templateName];
    if (selected) {
      setNewItem({
        ...newItem,
        ...selected,
      });
    }
  };

  const removeFileFromQueue = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setBulkUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const fs = Array.from(files);
    setSelectedFiles((prev) => {
      const updated = [...prev, ...fs];
      setBulkUploads(
        updated.map((f) => ({
          name: f.name,
          progress: 0,
          status: "pending",
          size: f.size,
        })),
      );
      return updated;
    });
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [siteInfoStatus, setSiteInfoStatus] = useState<string>("");
  const [projectAnalysis, setProjectAnalysis] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    col: string;
    id: string;
    label?: string;
  } | null>(null);

  const uploadFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);

      const fallbackToBase64 = () => {
        console.warn("Storage upload stalled or failed. Falling back to base64 encoding.");
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setUploadProgress(100);
          resolve(reader.result as string);
        };
        reader.onerror = (e) => {
          reject(e);
        };
      };

      // Set a 6 second timeout to fallback to base64 if upload is stuck
      const uploadTimeout = setTimeout(() => {
        fallbackToBase64();
      }, 6000);

      uploadBytes(storageRef, file)
        .then(async (snapshot) => {
          clearTimeout(uploadTimeout);
          const downloadURL = await getDownloadURL(snapshot.ref);
          setUploadProgress(100);
          resolve(downloadURL);
        })
        .catch((error) => {
          clearTimeout(uploadTimeout);
          console.warn("uploadBytes failed, falling back to base64:", error);
          fallbackToBase64();
        });
    });
  };

  const getCollectionName = (tab: string) => {
    const mapping: Record<string, string> = {
      Volunteers: "volunteers",
      Surveys: "surveys",
      Projects: "projects",
      "Impact Tracking": "beneficiaries",
      Events: "events",
      News: "news",
      Gallery: "gallery",
    };
    return mapping[tab] || tab.toLowerCase();
  };

  const fetchData = async () => {
    try {
      console.log("Fetching admin data...");
      const results = await Promise.allSettled([
        getVolunteers(),
        getSurveys(),
        getProjects(),
        getNews(),
        getGallery(),
        getEvents(),
        getBeneficiaries(),
        getAboutInfo(),
        getInquiries(),
      ]);

      const [
        vols,
        survs,
        projs,
        newsItems,
        gall,
        evts,
        beneficiaries,
        siteInfoDoc,
        inquiriesInfo,
      ] = results.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        console.error(
          `Fetch failed for index ${i}:`,
          (r as PromiseRejectedResult).reason,
        );
        return i === 7 ? {} : []; // Index 7 is aboutInfo
      }) as any[];

      console.log("Projects fetched:", (projs as any[])?.length || 0);

      setData({
        volunteers: vols || [],
        surveys: survs || [],
        projects: projs || [],
        news: newsItems || [],
        gallery: gall || [],
        events: evts || [],
        beneficiaries: beneficiaries || [],
        inquiries: inquiriesInfo || [],
        siteInfo: (siteInfoDoc as any) || {},
      });
    } catch (error) {
      console.error("Error in fetchData:", error);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // List of authorized administrator login emails. Add or edit emails here:
        const ADMIN_EMAILS = [
          "info@sinarimamfoundation.org.ng",
          "bondimadigitalworld@gmail.com",
          // You can append other custom admin emails below:
        ];
        const isAdminEmail = u.email && ADMIN_EMAILS.includes(u.email);
        setIsAdmin(!!isAdminEmail);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const saveSiteInfo = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSiteInfoStatus("Compressing and preparing assets...");
    try {
      let finalSiteInfo = { ...data.siteInfo };
      const uploadPromises: Promise<void>[] = [];

      if (founderPhotoFile) {
        setSiteInfoStatus("Compressing founder photo...");
        const compressedFounderFile = await compressImage(
          founderPhotoFile,
          800,
          800,
          0.82,
        );

        uploadPromises.push(
          (async () => {
            setSiteInfoStatus("Uploading founder photo...");
            const url = await uploadFile(compressedFounderFile);
            finalSiteInfo.founderPhoto = url;
            setFounderPhotoFile(null);
          })(),
        );
      }

      if (certificateFile) {
        setSiteInfoStatus("Compressing foundation certificate...");
        const compressedCertFile = await compressImage(
          certificateFile,
          1200,
          1200,
          0.85,
        );

        uploadPromises.push(
          (async () => {
            setSiteInfoStatus("Uploading foundation certificate...");
            const url = await uploadFile(compressedCertFile);
            finalSiteInfo.certificateImage = url;
            setCertificateFile(null);
          })(),
        );
      }

      if (logoFile) {
        setSiteInfoStatus("Compressing project logo...");
        const compressedLogoFile = await compressImage(
          logoFile,
          400,
          400,
          0.85,
        );

        uploadPromises.push(
          (async () => {
            setSiteInfoStatus("Uploading project logo...");
            const url = await uploadFile(compressedLogoFile);
            finalSiteInfo.logo = url;
            setLogoFile(null);
          })(),
        );
      }

      if (uploadPromises.length > 0) {
        setUploading(true);
        await Promise.all(uploadPromises);
      }

      setSiteInfoStatus("Saving site data...");
      await updateAboutInfo(finalSiteInfo);
      setSiteInfoStatus("");
      alert("Site information updated!");
      fetchData();
    } catch (err) {
      console.error("Save failed:", err);
      alert(
        `Error saving site info: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
      setUploading(false);
      setSiteInfoStatus("");
    }
  };

  const handleCreateOrUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const col = getCollectionName(activeTab);
      let payload = { ...newItem };

      if (selectedFiles.length > 0) {
        setUploading(true);
        if (col === "gallery" && !editingItem) {
          // Initialize local trackers to avoid concurrent state updates race conditions
          const trackers = selectedFiles.map((f) => ({
            name: f.name,
            progress: 0,
            status: "pending" as "pending" | "uploading" | "success" | "failed",
            size: f.size,
            error: "",
          }));
          setBulkUploads([...trackers]);
          setUploadProgress(0);

          const updateTracker = (index: number, updates: Partial<(typeof trackers)[0]>) => {
            trackers[index] = { ...trackers[index], ...updates };
            setBulkUploads([...trackers]);
            const totalProgress = trackers.reduce((sum, item) => sum + item.progress, 0);
            const overallProgress = Math.round(totalProgress / trackers.length);
            setUploadProgress(overallProgress);
          };

          // Let's execute all uploads concurrently
          const uploadPromises = selectedFiles.map(async (file, index) => {
            // Mark this file as starting to upload
            updateTracker(index, { status: "uploading", progress: 5 });

            try {
              // 1. Compress image to a highly efficient and lightweight size
              const fileToUpload = await compressImage(file, 800, 800, 0.75);
              updateTracker(index, { progress: 20 });

              // 2. Reference path
              const storageRef = ref(
                storage,
                `gallery/${Date.now()}-${fileToUpload.name}`,
              );

              // 3. Upload bytes with standard uploadBytes and smooth simulated progress tracker
              updateTracker(index, { progress: 35 });

              let simulatedProgress = 35;
              const interval = setInterval(() => {
                if (simulatedProgress < 85) {
                  simulatedProgress += Math.floor(Math.random() * 5) + 3;
                  if (simulatedProgress > 85) simulatedProgress = 85;
                  updateTracker(index, { progress: simulatedProgress });
                }
              }, 150);

              try {
                // Set up upload promise
                const uploadPromise = uploadBytes(storageRef, fileToUpload).then(async (snapshot) => {
                  const downloadURL = await getDownloadURL(snapshot.ref);
                  return downloadURL;
                });

                // Set up 12-second timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error("Firebase Storage upload timed out")), 12000);
                });

                let finalUrl: string;
                try {
                  // Race storage upload against the 12-second timeout
                  finalUrl = await Promise.race([uploadPromise, timeoutPromise]);
                } catch (raceErr) {
                  console.warn("Storage upload failed or timed out. Falling back to local Base64 encoding.", raceErr);
                  // Generate base64 fallback in less than 1ms
                  finalUrl = await new Promise<string>((resBase, rejBase) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(fileToUpload);
                    reader.onloadend = () => resBase(reader.result as string);
                    reader.onerror = (e) => rejBase(e);
                  });
                }

                clearInterval(interval);
                updateTracker(index, { progress: 90 });
                updateTracker(index, {
                  progress: 100,
                  status: "success",
                });
                return finalUrl;
              } catch (uploadErr: any) {
                clearInterval(interval);
                throw uploadErr;
              }
            } catch (err: any) {
              console.error(`Bulk upload failed for file ${file.name}:`, err);
              const errMsg = err?.message || String(err);
              updateTracker(index, {
                progress: 0,
                status: "failed",
                error: errMsg,
              });
              throw new Error(`Failed to upload '${file.name}': ${errMsg}`);
            }
          });

          const urls = await Promise.all(uploadPromises);

          const batch = writeBatch(db);
          urls.forEach((url, index) => {
            const file = selectedFiles[index];
            const docRef = doc(collection(db, "gallery"));
            batch.set(docRef, {
              title: newItem.title
                ? `${newItem.title} ${selectedFiles.length > 1 ? `(${index + 1})` : ""}`
                : file.name.split(".")[0],
              url,
              type: file.type.startsWith("video") ? "video" : "photo",
              createdAt: Timestamp.now(),
              projectId: newItem.projectId || "",
              projectTitle: newItem.projectTitle || "",
              eventName: newItem.eventName || "",
            });
          });
          await batch.commit();
          alert(
            `${selectedFiles.length} items successfully loaded and saved in bulk!`,
          );
          setShowModal(false);
          setNewItem({});
          setBulkUploads([]);
          setSelectedFiles([]);
          fetchData();
          return;
        } else if (selectedFiles.length >= 1) {
          const fileToUpload = await compressImage(
            selectedFiles[0],
            1024,
            1024,
            0.82,
          );
          const url = await uploadFile(fileToUpload);
          if (col === "gallery") payload.url = url;
          else if (col === "beneficiaries") payload.photoUrl = url;
          else payload.imageUrl = url;
        }
      }

      if (col === "projects") {
        if (!payload.status) payload.status = "Active";
        if (!payload.raisedAmount) payload.raisedAmount = 0;
      }

      if (col === "events") {
        if (!payload.time) payload.time = "10:00 AM - 2:00 PM";
        if (payload.date && typeof payload.date === "string") {
          const dateParts = payload.date.split("-");
          if (dateParts.length === 3) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
            const day = parseInt(dateParts[2], 10);
            const dateObj = new Date(year, month, day, 12, 0, 0); // Noon
            payload.date = Timestamp.fromDate(dateObj);
          } else {
            payload.date = Timestamp.fromDate(new Date(payload.date));
          }
        }
      }

      if (editingItem) {
        await updateDoc(doc(db, col, editingItem.id), payload);
        alert(`${activeTab} item updated!`);
      } else {
        payload.createdAt = Timestamp.now();
        await addDoc(collection(db, col), payload);
        alert(`${activeTab} item created!`);
      }

      setShowModal(false);
      setNewItem({});
      setEditingItem(null);
      setSelectedFiles([]);
      fetchData();
    } catch (err) {
      console.error("Save failed:", err);
      alert(
        `Error saving item: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setEmailAuthError("Please fill out both email and password fields.");
      return;
    }
    
    setEmailAuthError("");
    setEmailAuthLoading(true);
    try {
      if (authMode === "signin") {
        await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      } else {
        await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        alert("Account created! Access will be granted if this email is in our list of authorized administrators.");
      }
      setEmailInput("");
      setPasswordInput("");
    } catch (err: any) {
      console.error("Email auth error:", err);
      let msg = err.message || "An error occurred during authentication.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please verify your credentials.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Try signing in instead.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setEmailAuthError(msg);
    } finally {
      setEmailAuthLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    // Reset any local states
    setEmailInput("");
    setPasswordInput("");
    setEmailAuthError("");
  };

  const updateVolunteerStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "volunteers", id), { status });
    fetchData();
  };

  const deleteItem = (col: string, id: string, label?: string) => {
    setDeleteTarget({ col, id, label });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { col, id } = deleteTarget;
    setDeleteTarget(null);

    try {
      // Optimistically clean the state to ensure super-fast visually responsive updates
      setData((prev) => {
        const key = col as keyof typeof prev;
        if (Array.isArray(prev[key])) {
          return {
            ...prev,
            [key]: (prev[key] as any[]).filter((item: any) => item.id !== id),
          };
        }
        return prev;
      });

      await deleteDoc(doc(db, col, id));
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
      // Fallback: reload state if database write actually fails
      fetchData();
    }
  };

  const seedData = async () => {
    let shouldSeed = false;
    try {
      shouldSeed = window.confirm(
        "This will seed the database with sample NGO data. Local admin account must be authorized. Continue?",
      );
    } catch (e) {
      console.warn("Sandbox blocked window.confirm, seeding anyway:", e);
      shouldSeed = true;
    }
    if (!shouldSeed) return;

    try {
      const projects = [
        {
          title: "Clean Water Initiative",
          description:
            "Providing sustainable filtration systems to rural communities.",
          status: "Active",
          createdAt: Timestamp.now(),
        },
        {
          title: "Education for All",
          description: "Building literacy centers across the western region.",
          status: "Completed",
          createdAt: Timestamp.now(),
        },
      ];
      const news = [
        {
          title: "Annual Fundraiser Success",
          content: "We raised ₦50k for our new health center!",
          publishedAt: Timestamp.now(),
        },
        {
          title: "New Partnership with UN",
          content:
            "Sinarimam Foundation joins forces with the UN for climate resilience.",
          publishedAt: Timestamp.now(),
        },
      ];
      const events = [
        {
          title: "Community Gala",
          description: "Dinner and music fundraiser.",
          date: Timestamp.now(),
          location: "Main Hall",
        },
        {
          title: "Volunteer Training",
          description: "Onboarding session for new members.",
          date: Timestamp.now(),
          location: "Zoom",
        },
      ];
      const gallery = [
        {
          title: "Field Work 2023",
          url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000",
          type: "photo",
          createdAt: Timestamp.now(),
        },
        {
          title: "Community Meeting",
          url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000",
          type: "photo",
          createdAt: Timestamp.now(),
        },
      ];

      for (const p of projects) await addDoc(collection(db, "projects"), p);
      for (const n of news) await addDoc(collection(db, "news"), n);
      for (const e of events) await addDoc(collection(db, "events"), e);
      for (const g of gallery) await addDoc(collection(db, "gallery"), g);

      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "config", "about"), {
        vision:
          "A future where every community has the resources it needs to thrive sustainably.",
        mission:
          "To catalyze positive social change through innovative, data-driven projects and grassroots education.",
        goal: "To empower marginalized groups by providing tools for self-sufficiency and local leadership development.",
        history:
          "Founded in 2008 by a group of passionate educators and environmentalists, Sinarimam Foundation began as a small community newsletter in the rural outskirts. Over the past 16 years, we have grown into a multi-national organization support 50+ active projects annually.",
        founderName: "Dr. Sarah Jenkins",
        founderBio:
          "A visionary leader with a PhD in Social Development and 25 years of experience in NGO management and environmental advocacy.",
        founderWelcome:
          "We believe that empowerment begins with a single step towards community resilience. Over the last decade, Sinarimam Foundation has worked tirelessly to bridge gaps in education, health, and economic stability. Our progress is a testament to the collective power of dedicated individuals working towards a common goal of sustainable development and social justice.",
        contactEmail: "info@sinarimam.org",
        contactPhone: "+234 800 123 4567",
      });

      alert("Database seeded successfully!");
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error seeding database. Check console for details.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-ngo-blue font-bold">
        Verifying Credentials...
      </div>
    );

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto space-y-8 py-16 px-4">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-ngo-blue rounded-[32px] flex items-center justify-center text-lemon mx-auto shadow-xl">
            <ShieldCheck size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-ngo-blue tracking-tight">Restricted Area</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Please sign in with an authorized administrator account to access the management portal.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl space-y-6">
          {/* Auth Tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAuthTab("google");
                setEmailAuthError("");
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authTab === "google"
                  ? "bg-ngo-blue text-white shadow-md animate-fade-in"
                  : "text-slate-400 hover:text-ngo-blue hover:bg-slate-100/50"
              }`}
            >
              Google Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab("email");
                setEmailAuthError("");
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authTab === "email"
                  ? "bg-ngo-blue text-white shadow-md animate-fade-in"
                  : "text-slate-400 hover:text-ngo-blue hover:bg-slate-100/50"
              }`}
            >
              Email & Password
            </button>
          </div>

          {/* TAB 1: Google login */}
          {authTab === "google" && (
            <div className="space-y-4 py-2 animate-fade-in">
              <button
                type="button"
                onClick={handleLogin}
                className="w-full py-4 bg-ngo-blue hover:bg-ngo-blue/90 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.01] cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.8l2.4-2.4C17.3 1.7 14.9 1 12.24 1C6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.79 0 10.24-4.06 10.24-10.24 0-.62-.07-1.22-.2-1.8H12.24z" />
                </svg>
                Continue with Google
              </button>
              <p className="text-center text-[10.5px] text-slate-400">
                Uses Google Secure Account Sign-in services.
              </p>
            </div>
          )}

          {/* TAB 2: Email & Password login */}
          {authTab === "email" && (
            <form onSubmit={handleEmailAuth} className="space-y-4 py-1 animate-fade-in">
              {emailAuthError && (
                <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium leading-relaxed">
                  {emailAuthError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@sinarimamfoundation.org.ng"
                  className="w-full p-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm text-ngo-blue font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm text-ngo-blue font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={emailAuthLoading}
                className="w-full py-3.5 bg-ngo-blue hover:bg-ngo-blue/90 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all hover:scale-[1.01] cursor-pointer shadow-md text-sm mt-2"
              >
                {emailAuthLoading
                  ? "Authenticating..."
                  : authMode === "signin"
                    ? "Sign In with Email"
                    : "Create Admin Account"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "signin" ? "signup" : "signin");
                    setEmailAuthError("");
                  }}
                  className="text-xs font-bold text-ngo-blue hover:text-lemon transition-colors cursor-pointer"
                >
                  {authMode === "signin"
                    ? "New email account? Register here"
                    : "Already registered? Sign in here"}
                </button>
              </div>
            </form>
          )}
        </div>

        {user && !isAdmin && (
          <div className="space-y-4 p-5 bg-red-50 border border-red-100 rounded-3xl animate-fade-in text-center shadow-xs">
            <p className="text-xs text-red-600 font-bold">
              Account ({user.email}) does not have administrative privileges. Please verify if this email is in our authorized admin list.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Sign Out & Try Another Email
            </button>
          </div>
        )}
      </div>
    );
  }

  const tabs = [
    { name: "Overview", icon: <LayoutDashboard size={18} /> },
    {
      name: "Inquiries",
      icon: <Mail size={18} />,
      count: data.inquiries?.length || 0,
    },
    {
      name: "Volunteers",
      icon: <Briefcase size={18} />,
      count: data.volunteers.length,
    },
    {
      name: "Surveys",
      icon: <FileText size={18} />,
      count: data.surveys.length,
    },
    {
      name: "Projects",
      icon: <CheckCircle size={18} />,
      count: data.projects?.length || 0,
    },
    {
      name: "Impact Tracking",
      icon: <Compass size={18} />,
      count: data.beneficiaries.length,
    },
    { name: "Events", icon: <Calendar size={18} /> },
    { name: "News", icon: <Newspaper size={18} /> },
    { name: "Gallery", icon: <ImageIcon size={18} /> },
    { name: "Site Info", icon: <FileText size={18} /> },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-lemon flex items-center justify-center text-ngo-blue font-bold">
            AD
          </div>
          <div>
            <h2 className="font-bold text-ngo-blue">Portal Admin</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-all uppercase tracking-widest"
        >
          Sign Out <LogOut size={16} />
        </button>
      </header>

      <div className="flex gap-4 p-1 bg-white rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.name}
            onClick={() => setActiveTab(t.name)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${activeTab === t.name ? "bg-ngo-blue text-white shadow-lg" : "text-slate-400 hover:text-ngo-blue hover:bg-slate-50"}`}
          >
            {t.icon} {t.name}{" "}
            {t.count !== undefined && (
              <span className="opacity-50 ml-1">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-ngo-blue/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-2xl font-black text-ngo-blue">
                  {editingItem ? "Edit" : "Create New"}{" "}
                  {activeTab === "Gallery"
                    ? "Media"
                    : activeTab === "News"
                      ? "Article"
                      : activeTab.slice(0, -1)}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <form
                onSubmit={handleCreateOrUpdate}
                className="p-0 flex flex-col max-h-[80vh]"
              >
                <div className="p-8 pb-4 flex-1 overflow-y-auto no-scrollbar space-y-6">
                  {activeTab === "Projects" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Project Title
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Clean Water Initiative"
                          value={newItem.title || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, title: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Description
                        </label>
                        <textarea
                          required
                          placeholder="Describe the project goal and impact..."
                          value={newItem.description || ""}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              description: e.target.value,
                            })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white h-32 resize-none outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                      <DragAndDropImageField
                        label="Project Image"
                        sublabel="Direct drag-and-drop or select supported"
                        selectedFile={selectedFiles[0] || null}
                        onFileSelect={(file) =>
                          setSelectedFiles(file ? [file] : [])
                        }
                        existingUrl={newItem.imageUrl || ""}
                        onUrlChange={(url) =>
                          setNewItem({ ...newItem, imageUrl: url })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Target Amount (₦)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={newItem.targetAmount || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                targetAmount: Number(e.target.value),
                              })
                            }
                            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Raised Amount (₦)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 1500"
                            value={newItem.raisedAmount || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                raisedAmount: Number(e.target.value),
                              })
                            }
                            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Status
                        </label>
                        <select
                          value={newItem.status || "Active"}
                          onChange={(e) =>
                            setNewItem({ ...newItem, status: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option>Active</option>
                          <option>Completed</option>
                          <option>Upcoming</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === "Events" && (
                    <div className="space-y-4">
                      {/* One-Click Presets / Templates Hub */}
                      <div className="bg-amber-500/5 p-4 rounded-3xl border border-gold/15 space-y-2">
                        <span className="text-[10px] font-black tracking-widest text-gold uppercase block mb-1">
                          ⚡ ONE-CLICK EVENT BOOSTER (PRE-FILL TEMPLATES)
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => applyEventTemplate("outreach")}
                            className="bg-white hover:bg-slate-50 text-ngo-blue text-[10px] font-black py-2.5 px-2.5 rounded-xl border border-slate-200/80 shadow-sm text-center shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            🎁 Outreach Drive
                          </button>
                          <button
                            type="button"
                            onClick={() => applyEventTemplate("workshop")}
                            className="bg-white hover:bg-slate-50 text-ngo-blue text-[10px] font-black py-2.5 px-2.5 rounded-xl border border-slate-200/80 shadow-sm text-center shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            🎓 Skill Workshop
                          </button>
                          <button
                            type="button"
                            onClick={() => applyEventTemplate("health")}
                            className="bg-white hover:bg-slate-50 text-ngo-blue text-[10px] font-black py-2.5 px-2.5 rounded-xl border border-slate-200/80 shadow-sm text-center shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            🩺 Medical Camp
                          </button>
                          <button
                            type="button"
                            onClick={() => applyEventTemplate("gala")}
                            className="bg-white hover:bg-slate-50 text-ngo-blue text-[10px] font-black py-2.5 px-2.5 rounded-xl border border-slate-200/80 shadow-sm text-center shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            🎗️ Benefit Gala
                          </button>
                        </div>
                      </div>

                      {/* Event Title */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Event Title
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Annual Fundraising Gala"
                          value={newItem.title || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, title: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      {/* Date with helper buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Date
                          </label>
                          <input
                            required
                            type="date"
                            value={newItem.date || ""}
                            onChange={(e) =>
                              setNewItem({ ...newItem, date: e.target.value })
                            }
                            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all"
                          />
                          {/* Date Helpers */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const tom = new Date();
                                tom.setDate(tom.getDate() + 1);
                                setNewItem({ ...newItem, date: tom.toISOString().split("T")[0] });
                              }}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              Tomorrow
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextSat = new Date();
                                nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7 || 7));
                                setNewItem({ ...newItem, date: nextSat.toISOString().split("T")[0] });
                              }}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              Next Saturday
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const fut = new Date();
                                fut.setDate(fut.getDate() + 14);
                                setNewItem({ ...newItem, date: fut.toISOString().split("T")[0] });
                              }}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              In 2 Weeks
                            </button>
                          </div>
                        </div>

                        {/* Custom Time Range Field with preset suggestion buttons */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Event Time Range
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 10:00 AM - 2:00 PM"
                            value={newItem.time || ""}
                            onChange={(e) =>
                              setNewItem({ ...newItem, time: e.target.value })
                            }
                            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                          />
                          {/* Time Presets */}
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, time: "10:00 AM - 2:00 PM" })}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              10 AM - 2 PM
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, time: "09:00 AM - 1:00 PM" })}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              9 AM - 1 PM
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, time: "08:00 AM - 2:00 PM" })}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              8 AM - 2 PM
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewItem({ ...newItem, time: "06:00 PM - 10:00 PM" })}
                              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200/70 py-1 px-2 rounded-lg transition-all"
                            >
                              6 PM - 10 PM
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Location with indicator */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex justify-between">
                          <span>Location</span>
                          <span className="text-[9px] font-black text-amber-800 lowercase">
                            {newItem.location?.toLowerCase().includes("online") || newItem.location?.toLowerCase().includes("zoom") ? "🟢 auto-classified: online" : "🔵 auto-classified: in-person"}
                          </span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Main Hall, Abuja or Zoom Link"
                          value={newItem.location || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, location: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Description
                        </label>
                        <textarea
                          required
                          placeholder="Tell us more about the event..."
                          value={newItem.description || ""}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              description: e.target.value,
                            })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white h-32 resize-none outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      {/* Event Image */}
                      <DragAndDropImageField
                        label="Event Image"
                        sublabel="Direct drag-and-drop or select supported"
                        selectedFile={selectedFiles[0] || null}
                        onFileSelect={(file) =>
                          setSelectedFiles(file ? [file] : [])
                        }
                        existingUrl={newItem.imageUrl || ""}
                        onUrlChange={(url) =>
                          setNewItem({ ...newItem, imageUrl: url })
                        }
                      />

                      {/* LIVE PREVIEW COMPONENT */}
                      <div className="mt-6 border-t border-slate-100 pt-6 space-y-3">
                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live Real-Time Website Preview
                        </div>

                        <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 flex items-center justify-center">
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md w-full max-w-sm flex flex-col gap-5 relative overflow-hidden select-none pointer-events-none">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -mr-12 -mt-12"></div>
                            
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-16 bg-ngo-blue rounded-xl flex flex-col items-center justify-center text-white font-black shadow-md shadow-ngo-blue/10">
                                <span className="text-[8px] text-blue-200 uppercase opacity-75">
                                  {(() => {
                                    const d = newItem.date ? new Date(newItem.date) : new Date();
                                    return d.toLocaleDateString('en-US', { month: 'short' });
                                  })()}
                                </span>
                                <span className="text-xl tracking-tighter">
                                  {(() => {
                                    const d = newItem.date ? new Date(newItem.date) : new Date();
                                    return d.getDate();
                                  })()}
                                </span>
                              </div>
                              <span className="bg-slate-50 text-slate-400 text-[8px] font-black px-3 py-1 rounded-full tracking-widest uppercase border border-slate-100">
                                {newItem.location?.toLowerCase().includes('zoom') || newItem.location?.toLowerCase().includes('online') ? 'Online' : 'In-Person'}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="text-base font-black text-ngo-blue truncate">{newItem.title || "Untitled Preview Event"}</h3>
                              <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-2">{newItem.description || "Event description preview will populate here as you type..."}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-50 flex justify-between text-[10px] font-bold text-slate-400">
                              <div className="flex items-center gap-1">
                                <span className="text-lemon">🕒</span> {newItem.time || '10:00 AM - 2:00 PM'}
                              </div>
                              <div className="flex items-center gap-1 max-w-[150px] truncate">
                                <span className="text-gold">📍</span> {newItem.location || 'Location Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "News" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Article Title
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Major Achievement in Q1"
                          value={newItem.title || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, title: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Content
                        </label>
                        <textarea
                          required
                          placeholder="Write the full report here..."
                          value={newItem.content || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, content: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white h-48 resize-none outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                      <DragAndDropImageField
                        label="Lead Image"
                        sublabel="Direct drag-and-drop or select supported"
                        selectedFile={selectedFiles[0] || null}
                        onFileSelect={(file) =>
                          setSelectedFiles(file ? [file] : [])
                        }
                        existingUrl={newItem.imageUrl || ""}
                        onUrlChange={(url) =>
                          setNewItem({ ...newItem, imageUrl: url })
                        }
                      />
                    </div>
                  )}

                  {activeTab === "Gallery" && (
                    <GalleryForm
                      uploading={uploading}
                      bulkUploads={bulkUploads}
                      selectedFiles={selectedFiles}
                      newItem={newItem}
                      setNewItem={setNewItem}
                      handleFilesSelected={handleFilesSelected}
                      removeFileFromQueue={removeFileFromQueue}
                      setSelectedFiles={setSelectedFiles}
                      setBulkUploads={setBulkUploads}
                      editingItem={editingItem}
                      projects={data.projects}
                      events={data.events}
                    />
                  )}
                  {activeTab === "DEPRECATED_GALLERY" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Media Title
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Field Visit Photos"
                          value={newItem.title || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, title: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Upload Media (Bulk & Drag-Drop Support)
                        </label>
                        <input
                          type="file"
                          multiple={!editingItem}
                          accept="image/*,video/*"
                          onChange={(e) =>
                            setSelectedFiles(
                              e.target.files ? Array.from(e.target.files) : [],
                            )
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm"
                        />
                        {selectedFiles.length > 0 && (
                          <p className="text-[10px] font-bold text-lemon px-1">
                            {selectedFiles.length} file(s) selected
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 px-1 mt-1 italic">
                          Or enter Media URL manually
                        </p>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={newItem.url || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, url: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          Type
                        </label>
                        <select
                          value={newItem.type || "photo"}
                          onChange={(e) =>
                            setNewItem({ ...newItem, type: e.target.value })
                          }
                          className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="photo">Photo</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === "Impact Tracking" && (
                    <div className="space-y-6">
                      <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest">
                          Project Context
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Project
                            </label>
                            <select
                              required
                              value={newItem.projectId || ""}
                              onChange={(e) => {
                                const p = data.projects.find(
                                  (proj: any) => proj.id === e.target.value,
                                );
                                setNewItem({
                                  ...newItem,
                                  projectId: e.target.value,
                                  projectName: p?.title,
                                });
                              }}
                              className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-lemon outline-none transition-all appearance-none cursor-pointer text-sm"
                            >
                              <option value="">Select Project</option>
                              {data.projects.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.title}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={newItem.date || ""}
                              onChange={(e) =>
                                setNewItem({ ...newItem, date: e.target.value })
                              }
                              className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-lemon outline-none transition-all text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                            Location
                          </label>
                          <input
                            type="text"
                            placeholder="Event/Center Location"
                            value={newItem.location || ""}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                location: e.target.value,
                              })
                            }
                            className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-lemon outline-none transition-all placeholder:text-slate-300 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest border-b border-slate-100 pb-2">
                          Beneficiary Bio
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Full Name
                            </label>
                            <input
                              required
                              type="text"
                              value={newItem.name || ""}
                              onChange={(e) =>
                                setNewItem({ ...newItem, name: e.target.value })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              DOB
                            </label>
                            <input
                              type="date"
                              value={newItem.dob || ""}
                              onChange={(e) =>
                                setNewItem({ ...newItem, dob: e.target.value })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Gender
                            </label>
                            <select
                              value={newItem.gender || "Female"}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  gender: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm"
                            >
                              <option>Female</option>
                              <option>Male</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Nationality
                            </label>
                            <input
                              type="text"
                              value={newItem.nationality || "Nigerian"}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  nationality: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              State of Origin
                            </label>
                            <input
                              type="text"
                              value={newItem.stateOfOrigin || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  stateOfOrigin: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              State of Birth
                            </label>
                            <input
                              type="text"
                              value={newItem.stateOfBirth || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  stateOfBirth: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              LG of Origin
                            </label>
                            <input
                              type="text"
                              value={newItem.lgOfOrigin || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  lgOfOrigin: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Residential Address
                            </label>
                            <input
                              type="text"
                              value={newItem.residentialAddress || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  residentialAddress: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                           <div className="lg:col-span-2">
                             <DragAndDropImageField
                               label="Photo Upload"
                               sublabel="Direct drag-and-drop or select supported"
                               selectedFile={selectedFiles[0] || null}
                               onFileSelect={(file) =>
                                 setSelectedFiles(file ? [file] : [])
                               }
                               existingUrl={newItem.photoUrl || ""}
                               onUrlChange={(url) =>
                                 setNewItem({ ...newItem, photoUrl: url })
                               }
                             />
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest border-b border-slate-100 pb-2">
                          Parent/Guardian Contact
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Parent Name
                            </label>
                            <input
                              type="text"
                              value={newItem.parentName || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  parentName: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Phone Number
                            </label>
                            <input
                              type="text"
                              value={newItem.parentPhone || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  parentPhone: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                              Address
                            </label>
                            <input
                              type="text"
                              value={newItem.parentAddress || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  parentAddress: e.target.value,
                                })
                              }
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest border-b border-slate-100 pb-2">
                          Benefits Provided
                        </h4>

                        <div className="space-y-4 p-4 lg:p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                          <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">
                            Education
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              "School Bag",
                              "Shoe",
                              "Socks",
                              "Books",
                              "Writing Materials",
                              "WAEC/NECO/JAMB Fees",
                            ].map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  const current =
                                    newItem.educationBenefits || [];
                                  const next = current.includes(item)
                                    ? current.filter((i: string) => i !== item)
                                    : [...current, item];
                                  setNewItem({
                                    ...newItem,
                                    educationBenefits: next,
                                  });
                                }}
                                className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.educationBenefits?.includes(item) ? "bg-ngo-blue text-white border-ngo-blue" : "bg-white text-slate-400 border-slate-100 hover:border-lemon"}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                          <div className="pt-4 border-t border-slate-200 space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Scholarship Details
                            </p>
                            <input
                              type="text"
                              placeholder="Name of School"
                              value={newItem.scholarship?.schoolName || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  scholarship: {
                                    ...(newItem.scholarship || {}),
                                    schoolName: e.target.value,
                                  },
                                })
                              }
                              className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                placeholder="Amount Paid (₦)"
                                value={newItem.scholarship?.amount || ""}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    scholarship: {
                                      ...(newItem.scholarship || {}),
                                      amount: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Duration"
                                value={newItem.scholarship?.duration || ""}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    scholarship: {
                                      ...(newItem.scholarship || {}),
                                      duration: e.target.value,
                                    },
                                  })
                                }
                                className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 p-4 lg:p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                          <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">
                            Health
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {["Sanitary Pads"].map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  const current = newItem.healthBenefits || [];
                                  const next = current.includes(item)
                                    ? current.filter((i: string) => i !== item)
                                    : [...current, item];
                                  setNewItem({
                                    ...newItem,
                                    healthBenefits: next,
                                  });
                                }}
                                className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.healthBenefits?.includes(item) ? "bg-ngo-blue text-white border-ngo-blue" : "bg-white text-slate-400 border-slate-100 hover:border-lemon"}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                          <div className="pt-4 border-t border-slate-200 space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Medical Outreach
                            </p>
                            <input
                              type="text"
                              placeholder="Diagnosis"
                              value={newItem.medicalOutreach?.diagnosis || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  medicalOutreach: {
                                    ...(newItem.medicalOutreach || {}),
                                    diagnosis: e.target.value,
                                  },
                                })
                              }
                              className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Drugs Given"
                              value={newItem.medicalOutreach?.drugs || ""}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  medicalOutreach: {
                                    ...(newItem.medicalOutreach || {}),
                                    drugs: e.target.value,
                                  },
                                })
                              }
                              className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 p-4 lg:p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                          <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">
                            Social Protection - Clothing
                          </label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              "Shirts",
                              "Trousers",
                              "Skirts",
                              "Blouse",
                              "Shoes",
                              "Gowns",
                              "Wrappers",
                              "Others",
                            ].map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  const current = newItem.clothing || [];
                                  const next = current.includes(item)
                                    ? current.filter((i: string) => i !== item)
                                    : [...current, item];
                                  setNewItem({ ...newItem, clothing: next });
                                }}
                                className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.clothing?.includes(item) ? "bg-ngo-blue text-white border-ngo-blue" : "bg-white text-slate-400 border-slate-100 hover:border-lemon"}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                          <div className="pt-4 border-t border-slate-200 space-y-4">
                            <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">
                              Accessories
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {[
                                "Wristwatch",
                                "Handbag",
                                "Bangles",
                                "Belt",
                                "Others",
                              ].map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => {
                                    const current = newItem.accessories || [];
                                    const next = current.includes(item)
                                      ? current.filter(
                                          (i: string) => i !== item,
                                        )
                                      : [...current, item];
                                    setNewItem({
                                      ...newItem,
                                      accessories: next,
                                    });
                                  }}
                                  className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.accessories?.includes(item) ? "bg-ngo-blue text-white border-ngo-blue" : "bg-white text-slate-400 border-slate-100 hover:border-lemon"}`}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 bg-white rounded-b-[40px]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      setSelectedFiles([]);
                    }}
                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || uploading}
                    className="flex-[2] py-4 bg-ngo-blue text-white rounded-2xl font-black shadow-xl shadow-ngo-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {uploading
                      ? `Uploading... ${uploadProgress > 0 ? uploadProgress + "%" : ""}`
                      : isSaving
                        ? "Saving..."
                        : editingItem
                          ? "Update Item"
                          : "Create Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 bg-ngo-blue/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-ngo-blue">
                  Delete Item?
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Are you sure you want to permanently delete this item? This
                  action is irreversible and will remove it from the
                  security-logged records.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 transition-all text-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8"
        >
          {/* Inquiries Tab */}
          {activeTab === "Inquiries" && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-4 px-2">
                <div>
                  <h3 className="text-2xl font-black text-ngo-blue">
                    Received Messages
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 font-medium">
                    Contact form inquiries securely captured from the website
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {data.inquiries?.length || 0} Total
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {!data.inquiries || data.inquiries.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-3">
                    <Mail className="mx-auto text-slate-300" size={48} />
                    <p className="font-medium">
                      No inbox messages received yet.
                    </p>
                  </div>
                ) : (
                  data.inquiries.map((i: any) => (
                    <div
                      key={i.id}
                      className="p-6 md:p-8 rounded-[32px] border border-slate-100 bg-slate-50/50 flex flex-col gap-4 relative group hover:border-lemon/30 transition-all text-left"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-lemon rounded-2xl flex items-center justify-center text-ngo-blue font-black uppercase">
                            {i.name ? i.name.charAt(0) : "I"}
                          </div>
                          <div className="text-left">
                            <p className="font-extrabold text-ngo-blue text-lg">
                              {i.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {i.phone && (
                                <span className="block font-semibold text-ngo-blue">
                                  Phone: {i.phone}
                                </span>
                              )}
                              {i.email && (
                                <span className="block text-slate-450">
                                  Email: {i.email}
                                </span>
                              )}
                              <span className="block text-slate-400 text-[11px] mt-0.5">
                                Submitted:{" "}
                                {i.submittedAt
                                  ? new Date(
                                      i.submittedAt.toDate(),
                                    ).toLocaleString()
                                  : "Recent"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteItem("inquiries", i.id)}
                            className="p-2 border border-slate-200 hover:border-red-500 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete Message"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200/60 space-y-2 text-left">
                        <p className="text-[10px] uppercase font-bold text-gold tracking-widest">
                          Subject:{" "}
                          <span className="text-ngo-blue font-black">
                            {i.subject || "General Inquiry"}
                          </span>
                        </p>
                        <div className="text-sm text-slate-600 bg-white p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                          {i.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Volunteers Tab */}
          {activeTab === "Volunteers" && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-4 px-2">
                <h3 className="text-2xl font-black text-ngo-blue">
                  Volunteer Applications
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {data.volunteers.length} Total
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {data.volunteers.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-ngo-blue rounded-2xl flex items-center justify-center text-white font-bold uppercase">
                        {v.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-ngo-blue">{v.fullName}</p>
                        <p className="text-xs text-slate-400">
                          {v.email} • {v.phone}
                        </p>
                      </div>
                    </div>
                    <div className="max-w-md flex-1 text-xs text-slate-500 italic px-6 border-x border-slate-100 line-clamp-2">
                      "{v.experience}"
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.status === "Approved" ? "bg-green-100 text-green-700" : v.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-gold/20 text-gold"}`}
                      >
                        {v.status}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateVolunteerStatus(v.id, "Approved")
                          }
                          className="p-2 bg-white rounded-xl text-green-500 shadow-sm hover:bg-green-50 hover:scale-110 active:scale-95 transition-all"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() =>
                            updateVolunteerStatus(v.id, "Rejected")
                          }
                          className="p-2 bg-white rounded-xl text-red-400 shadow-sm hover:bg-red-50 hover:scale-110 active:scale-95 transition-all"
                        >
                          <XCircle size={18} />
                        </button>
                        <button
                          onClick={() => deleteItem("volunteers", v.id)}
                          className="p-2 bg-white rounded-xl text-slate-300 hover:text-red-500 shadow-sm hover:scale-110 active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Surveys Tab */}
          {activeTab === "Surveys" && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-ngo-blue px-2">
                Community Feedback
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.surveys.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 relative group"
                  >
                    <button
                      onClick={() => deleteItem("surveys", s.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gold uppercase tracking-widest">
                          Survey: {s.surveyTitle}
                        </p>
                        <h4 className="font-bold text-ngo-blue">
                          {s.respondentName || "Anonymous Respondent"}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 italic">
                        {new Date(s.submittedAt?.toDate()).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          Satisfaction Score:
                        </span>
                        <span className="font-black text-ngo-blue">
                          {s.answers.satisfaction}/5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Resource Needs:</span>
                        <span className="font-bold uppercase text-ngo-blue">
                          {s.answers.needFrequency}
                        </span>
                      </div>
                      {s.answers.communityImpact && (
                        <p className="mt-2 text-slate-500 leading-relaxed border-t border-slate-200 pt-2 italic">
                          "{s.answers.communityImpact}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Impact Tracking" && (
            <div className="space-y-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                <div>
                  <h3 className="text-2xl font-black text-ngo-blue">
                    Impact & Beneficiary Logs
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Tracking the real-world difference per project
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewItem({ gender: "Female", nationality: "Nigerian" });
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="w-full sm:w-auto bg-lemon text-ngo-blue px-10 py-4 rounded-2xl sm:rounded-full text-sm font-black shadow-lg shadow-lemon/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={20} /> Register Beneficiary
                </button>
              </div>

              {/* General Project Analysis/Summary */}
              <div className="grid grid-cols-1 gap-8">
                <div className="p-8 bg-slate-900 rounded-[48px] text-white shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-lemon opacity-5 blur-[100px] -mr-32 -mt-32"></div>
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-lemon uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                      Project Summary & Analysis
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Select Project to Analyze
                        </label>
                        <select
                          className="w-full p-6 bg-white/5 rounded-3xl border-2 border-white/10 text-white font-bold text-lg outline-none focus:border-lemon transition-all appearance-none cursor-pointer"
                          onChange={(e) => {
                            const projId = e.target.value;
                            if (!projId) {
                              setProjectAnalysis(null);
                              return;
                            }
                            const beneficiaries = data.beneficiaries.filter(
                              (b: any) => b.projectId === projId,
                            );
                            const summaries = {
                              total: beneficiaries.length,
                              female: beneficiaries.filter(
                                (b: any) => b.gender === "Female",
                              ).length,
                              male: beneficiaries.filter(
                                (b: any) => b.gender === "Male",
                              ).length,
                              scholarships: beneficiaries.filter(
                                (b: any) => b.scholarship?.amount > 0,
                              ).length,
                              totalScholarshipAmount: beneficiaries.reduce(
                                (acc: number, b: any) =>
                                  acc + (Number(b.scholarship?.amount) || 0),
                                0,
                              ),
                              medicalOutreach: beneficiaries.filter(
                                (b: any) => b.medicalOutreach?.diagnosis,
                              ).length,
                              clothingItems: beneficiaries.reduce(
                                (acc: number, b: any) =>
                                  acc + (b.clothing?.length || 0),
                                0,
                              ),
                              accessoryItems: beneficiaries.reduce(
                                (acc: number, b: any) =>
                                  acc + (b.accessories?.length || 0),
                                0,
                              ),
                            };
                            setProjectAnalysis(summaries);
                          }}
                        >
                          <option value="" className="bg-slate-900">
                            Choose a project...
                          </option>
                          {data.projects.map((p: any) => (
                            <option
                              key={p.id}
                              value={p.id}
                              className="bg-slate-900"
                            >
                              {p.title}
                            </option>
                          ))}
                        </select>

                        {projectAnalysis && (
                          <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Total Beneficiaries
                              </p>
                              <p className="text-4xl font-black text-lemon mt-2">
                                {projectAnalysis.total}
                              </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Female Reach
                              </p>
                              <p className="text-4xl font-black text-pink-400 mt-2">
                                {projectAnalysis.female}
                              </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Scholarships
                              </p>
                              <p className="text-4xl font-black text-gold mt-2">
                                {projectAnalysis.scholarships}
                              </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Total Schol. Aid
                              </p>
                              <p className="text-2xl font-black text-green-400 mt-2">
                                ₦
                                {projectAnalysis.totalScholarshipAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {projectAnalysis ? (
                          <div className="space-y-6">
                            <div className="p-6 lg:p-8 bg-lemon rounded-[40px] text-ngo-blue">
                              <p className="text-xs font-black uppercase tracking-widest opacity-60">
                                Impact Snapshot
                              </p>
                              <div className="mt-8 space-y-4">
                                <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
                                  <span className="text-sm font-black">
                                    Medical Aids
                                  </span>
                                  <span className="text-lg font-black">
                                    {projectAnalysis.medicalOutreach}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
                                  <span className="text-sm font-black">
                                    Clothing Items
                                  </span>
                                  <span className="text-lg font-black">
                                    {projectAnalysis.clothingItems}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
                                  <span className="text-sm font-black">
                                    Accessories
                                  </span>
                                  <span className="text-lg font-black">
                                    {projectAnalysis.accessoryItems}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 italic font-medium leading-relaxed px-4">
                              * Analysis is generated based on current
                              beneficiary records synced with this project ID.
                              Ensure all field logs are updated for accuracy.
                            </p>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-12 bg-white/5 rounded-[40px] border border-dashed border-white/10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                              <BarChart2 size={32} />
                            </div>
                            <p className="text-slate-500 font-bold max-w-xs">
                              Select a project to generate a real-time impact
                              analysis and demographic summary.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficiary Logs List */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-ngo-blue px-2 flex items-center gap-2">
                  <CheckCircle className="text-green-500" /> Beneficiary Record
                  Logs
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {data.beneficiaries.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                            {b.photoUrl ? (
                              <img
                                src={b.photoUrl}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <UserIcon size={24} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h5 className="font-black text-ngo-blue text-lg">
                              {b.name}
                            </h5>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase tracking-wider">
                                {b.gender}
                              </span>
                              <span className="px-2 py-0.5 bg-lemon/20 text-[10px] font-bold text-ngo-blue rounded-md uppercase tracking-wider">
                                {b.projectName || "General"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex gap-1">
                            {b.educationBenefits?.length > 0 && (
                              <div
                                className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"
                                title="Education aid provided"
                              >
                                <GraduationCap size={12} />
                              </div>
                            )}
                            {b.healthBenefits?.length > 0 && (
                              <div
                                className="w-6 h-6 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center"
                                title="Health aid provided"
                              >
                                <HeartPulse size={12} />
                              </div>
                            )}
                            {b.clothing?.length > 0 && (
                              <div
                                className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center"
                                title="Clothing provided"
                              >
                                <ShoppingBag size={12} />
                              </div>
                            )}
                          </div>
                          <div className="h-10 w-px bg-slate-100 hidden md:block mx-2"></div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(b);
                                setNewItem({ ...b });
                                setShowModal(true);
                              }}
                              className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-gold hover:text-ngo-blue flex items-center justify-center transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem("beneficiaries", b.id)}
                              className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content Management (Shared for Projects, Events, News, Gallery) */}
          {["Projects", "Events", "News", "Gallery"].includes(activeTab) && (
            <div className="space-y-8">
              <div className="flex justify-between items-end px-2">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-ngo-blue">
                    {activeTab} Management
                  </h3>
                  {activeTab === "Projects" && data.projects.length === 0 && (
                    <p className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded inline-block uppercase tracking-widest animate-pulse">
                      Debug: Check Firestore Collection "projects" / Refresh
                    </p>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={fetchData}
                    className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <BarChart2 size={16} /> Sync
                  </button>
                </div>

                <button
                  onClick={() => {
                    setNewItem({});
                    setEditingItem(null);
                    setShowModal(true);
                  }}
                  className="w-full sm:w-auto bg-lemon text-ngo-blue px-8 py-3.5 rounded-2xl sm:rounded-full text-sm font-black shadow-lg shadow-lemon/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={20} /> Create New
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const list =
                    activeTab === "Projects"
                      ? data.projects || []
                      : activeTab === "Events"
                        ? data.events || []
                        : activeTab === "News"
                          ? data.news || []
                          : data.gallery || [];

                  if (list.length === 0) {
                    return (
                      <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200 w-full">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                          No {activeTab} Records Found
                        </p>
                        <p className="text-[10px] text-slate-300 mt-1">
                          Add your first item using the create button above.
                        </p>
                      </div>
                    );
                  }

                  return list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-3xl border border-slate-100 bg-white flex items-center justify-between gap-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center text-slate-400">
                          {item.imageUrl || item.url ? (
                            <img
                              src={item.imageUrl || item.url}
                              className="w-full h-full object-cover"
                            />
                          ) : activeTab === "Events" ? (
                            <Calendar size={24} />
                          ) : null}
                        </div>
                        <div className="max-w-md">
                          <h4 className="font-bold text-ngo-blue truncate">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {activeTab === "Projects"
                              ? item.status
                              : activeTab === "Events"
                                ? `${item.date?.toDate ? new Date(item.date.toDate()).toLocaleDateString() : item.date} @ ${item.location}`
                                : activeTab === "News"
                                  ? item.publishedAt
                                    ? new Date(
                                        item.publishedAt.toDate(),
                                      ).toLocaleDateString()
                                    : "Draft"
                                  : item.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const editData = { ...item };
                            if (
                              activeTab === "Events" &&
                              editData.date?.toDate
                            ) {
                              editData.date = new Date(editData.date.toDate())
                                .toISOString()
                                .split("T")[0];
                            }
                            setEditingItem(item);
                            setNewItem(editData);
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-ngo-blue transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() =>
                            deleteItem(getCollectionName(activeTab), item.id)
                          }
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {activeTab === "Site Info" && (
            <form onSubmit={saveSiteInfo} className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                <h3 className="text-2xl font-black text-ngo-blue">
                  Core Website Content
                </h3>
                <button
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-ngo-blue text-white px-10 py-4 rounded-2xl sm:rounded-full text-sm font-black shadow-xl shadow-ngo-blue/30 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isSaving
                    ? siteInfoStatus || "Saving Changes..."
                    : "Save Site Info"}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2">
                    <ImageIcon size={18} className="text-gold" /> Project
                    Branding & Logo
                  </h4>
                  <div className="space-y-4">
                    <DragAndDropImageField
                      label="Project Logo"
                      sublabel="Direct drag-and-drop or select supported"
                      selectedFile={logoFile}
                      onFileSelect={(file) => setLogoFile(file)}
                      existingUrl={data.siteInfo?.logo || ""}
                      onUrlChange={(url) =>
                        setData({
                          ...data,
                          siteInfo: {
                            ...data.siteInfo,
                            logo: url,
                          },
                        })
                      }
                    />
                  </div>

                  <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Compass size={18} className="text-lemon" /> Mission &
                    Vision
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Our Vision
                      </label>
                      <textarea
                        placeholder="Where do we see this NGO in 5 years?"
                        value={data.siteInfo?.vision || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              vision: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-24 resize-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Our Mission
                      </label>
                      <textarea
                        placeholder="Our daily commitment to the community..."
                        value={data.siteInfo?.mission || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              mission: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-24 resize-none placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Our Goal
                      </label>
                      <textarea
                        placeholder="Specific objectives we are striving for..."
                        value={data.siteInfo?.goal || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              goal: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-24 resize-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2 mt-8">
                    <History size={18} className="text-gold" /> History
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                      Foundation Story
                    </label>
                    <textarea
                      placeholder="How it all started..."
                      value={data.siteInfo?.history || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          siteInfo: {
                            ...data.siteInfo,
                            history: e.target.value,
                          },
                        })
                      }
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-48 resize-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2">
                    <UserIcon size={18} className="text-blue-400" /> Founder
                    Details
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Founder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={data.siteInfo?.founderName || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              founderName: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Founder Bio
                      </label>
                      <textarea
                        placeholder="Brief professional background..."
                        value={data.siteInfo?.founderBio || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              founderBio: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-32 resize-none placeholder:text-slate-300"
                      />
                    </div>
                    <DragAndDropImageField
                      label="Founder Photo"
                      sublabel="Direct drag-and-drop or select supported"
                      selectedFile={founderPhotoFile}
                      onFileSelect={(file) => setFounderPhotoFile(file)}
                      existingUrl={data.siteInfo?.founderPhoto || ""}
                      onUrlChange={(url) =>
                        setData({
                          ...data,
                          siteInfo: {
                            ...data.siteInfo,
                            founderPhoto: url,
                          },
                        })
                      }
                    />
                    <DragAndDropImageField
                      label="Foundation Certificate"
                      sublabel="Upload the official registration or incorporation seal"
                      selectedFile={certificateFile}
                      onFileSelect={(file) => setCertificateFile(file)}
                      existingUrl={data.siteInfo?.certificateImage || ""}
                      onUrlChange={(url) =>
                        setData({
                          ...data,
                          siteInfo: {
                            ...data.siteInfo,
                            certificateImage: url,
                          },
                        })
                      }
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Founder Welcome Note
                      </label>
                      <textarea
                        placeholder="Welcome message for the home page..."
                        value={data.siteInfo?.founderWelcome || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              founderWelcome: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-32 resize-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2 mt-8">
                    <Mail size={18} className="text-lemon" /> Contact
                    Information
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Official Email
                      </label>
                      <input
                        type="email"
                        placeholder="contact@ngoname.org"
                        value={data.siteInfo?.contactEmail || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              contactEmail: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+1 (234) 567 890"
                        value={data.siteInfo?.contactPhone || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              contactPhone: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2 mt-8">
                    <Briefcase size={18} className="text-gold" /> Volunteer Recruitment Controls
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Volunteer Recruitment Status
                      </label>
                      <select
                        value={data.siteInfo?.volunteerRecruitmentOpen ?? "true"}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              volunteerRecruitmentOpen: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm font-bold text-ngo-blue"
                      >
                        <option value="true">Open (Recruiting new volunteers)</option>
                        <option value="false">Closed (Applications suspended)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Orientation Date Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. May 30, 2026"
                        value={data.siteInfo?.volunteerOrientationDate || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              volunteerOrientationDate: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Leave blank or type custom status if volunteers are not currently recruited.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                        Orientation Venue / Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Main Lobby • 10:00 AM"
                        value={data.siteInfo?.volunteerOrientationDetails || ""}
                        onChange={(e) =>
                          setData({
                            ...data,
                            siteInfo: {
                              ...data.siteInfo,
                              volunteerOrientationDetails: e.target.value,
                            },
                          })
                        }
                        className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === "Overview" && (
            <div className="space-y-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-ngo-blue">
                  Administrative Overview
                </h3>
                <button
                  onClick={seedData}
                  className="text-xs font-bold text-slate-400 hover:text-gold transition-colors border-b border-dashed border-slate-200"
                >
                  Seed Demo Data
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-lemon rounded-[40px] text-ngo-blue shadow-lg shadow-lemon/20">
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">
                    Pending Volunteers
                  </p>
                  <p className="text-5xl font-black mt-2">
                    {
                      data.volunteers.filter((v: any) => v.status === "Pending")
                        .length
                    }
                  </p>
                </div>
                <div className="p-8 bg-gold rounded-[40px] text-ngo-blue shadow-lg shadow-gold/20">
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">
                    Impact Points
                  </p>
                  <p className="text-5xl font-black mt-2">
                    {data.surveys.length}
                  </p>
                </div>
                <div className="p-8 bg-ngo-blue rounded-[40px] text-white shadow-xl shadow-ngo-blue/20">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-300">
                    Live Projects
                  </p>
                  <p className="text-5xl font-black mt-2 text-lemon">
                    {data.projects.length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-ngo-blue flex items-center gap-2">
                    <CheckCircle className="text-green-500" /> Recent Activity
                  </h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-lemon"></div>
                        <p className="text-sm text-slate-600">
                          New volunteer application received from community
                          member.
                        </p>
                        <span className="ml-auto text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                          {i * 5}m ago
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-ngo-blue flex items-center gap-2">
                    <ImageIcon className="text-gold" /> Media Quick View
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {data.gallery.slice(0, 8).map((g: any) => (
                      <div
                        key={g.id}
                        className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
                      >
                        <img
                          src={g.url}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
