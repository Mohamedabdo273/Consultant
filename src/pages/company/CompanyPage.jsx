import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Building2, Phone, Globe, Mail, MapPin,
  Sparkles, Image, Upload, Save, X,
} from 'lucide-react';
import { companyApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { PageLoader, Spinner, FormField } from '../../components/common/index';

const TABS = [
  { id: 'profile',  label: 'Profile',      icon: Building2 },
  { id: 'contact',  label: 'Contact',      icon: Phone },
  { id: 'ai',       label: 'AI Settings',  icon: Sparkles },
  { id: 'logo',     label: 'Logo',         icon: Image },
];

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ company }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name:        company?.name        ?? '',
      industry:    company?.industry    ?? '',
      description: company?.description ?? '',
      website:     company?.website     ?? '',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name:        company.name        ?? '',
        industry:    company.industry    ?? '',
        description: company.description ?? '',
        website:     company.website     ?? '',
      });
    }
  }, [company, reset]);

  const mutation = useMutation({
    mutationFn: (data) => companyApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Company Name" required error={errors.name?.message}>
          <input
            {...register('name', { required: 'Company name is required' })}
            className="input"
            placeholder="Acme Corporation"
          />
        </FormField>

        <FormField label="Industry" error={errors.industry?.message}>
          <input
            {...register('industry')}
            className="input"
            placeholder="e.g. Technology, Finance, Healthcare"
          />
        </FormField>
      </div>

      <FormField label="Description" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={4}
          className="input resize-none"
          placeholder="Describe your company..."
        />
      </FormField>

      <FormField label="Website" error={errors.website?.message}>
        <div className="relative">
          <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register('website')}
            type="url"
            className="input pl-9"
            placeholder="https://example.com"
          />
        </div>
      </FormField>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2 text-sm"
        >
          {mutation.isPending ? <Spinner size="sm" /> : <Save size={15} />}
          Save Profile
        </button>
      </div>
    </form>
  );
}

// ── Contact Tab ───────────────────────────────────────────────────────────────
function ContactTab({ company }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      contactEmail: company?.contactEmail ?? '',
      contactPhone: company?.contactPhone ?? '',
      address:      company?.address      ?? '',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        contactEmail: company.contactEmail ?? '',
        contactPhone: company.contactPhone ?? '',
        address:      company.address      ?? '',
      });
    }
  }, [company, reset]);

  const mutation = useMutation({
    mutationFn: (data) => companyApi.updateContact(data),
    onSuccess: () => {
      toast.success('Contact information updated');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
    onError: () => toast.error('Failed to update contact information'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <FormField label="Contact Email" error={errors.contactEmail?.message}>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register('contactEmail', {
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
            type="email"
            className="input pl-9"
            placeholder="contact@company.com"
          />
        </div>
      </FormField>

      <FormField label="Contact Phone" error={errors.contactPhone?.message}>
        <div className="relative">
          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            {...register('contactPhone')}
            type="tel"
            className="input pl-9"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </FormField>

      <FormField label="Address" error={errors.address?.message}>
        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-3.5 text-gray-400" />
          <textarea
            {...register('address')}
            rows={3}
            className="input pl-9 resize-none"
            placeholder="123 Main St, City, Country"
          />
        </div>
      </FormField>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2 text-sm"
        >
          {mutation.isPending ? <Spinner size="sm" /> : <Save size={15} />}
          Save Contact
        </button>
      </div>
    </form>
  );
}

// ── AI Settings Tab ───────────────────────────────────────────────────────────
function AISettingsTab({ company }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { customPrompt: company?.customPrompt ?? '' },
  });

  useEffect(() => {
    if (company) reset({ customPrompt: company.customPrompt ?? '' });
  }, [company, reset]);

  const mutation = useMutation({
    mutationFn: (data) => companyApi.updatePrompt(data),
    onSuccess: () => {
      toast.success('AI settings saved');
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
    onError: () => toast.error('Failed to save AI settings'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl">
        <Sparkles size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-purple-800">How AI uses this prompt</p>
          <p className="text-sm text-purple-700 leading-relaxed">
            Your custom prompt is injected into the AI assistant's system context. Use it to define
            your company's tone, industry terminology, preferred response style, or any domain-specific
            knowledge the assistant should apply when answering questions or generating content.
          </p>
        </div>
      </div>

      <FormField label="Custom AI Prompt">
        <textarea
          {...register('customPrompt')}
          rows={10}
          className="input resize-none font-mono text-sm leading-relaxed"
          placeholder={`You are a helpful AI assistant for {Company Name}. We specialize in...

When responding:
- Use formal and professional language
- Focus on our industry: [your industry]
- Prioritize accuracy and clarity
- Reference company values when relevant`}
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Leave blank to use the default AI behavior. Changes apply to all new conversations.
        </p>
      </FormField>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2 text-sm"
        >
          {mutation.isPending ? <Spinner size="sm" /> : <Sparkles size={15} />}
          Save AI Settings
        </button>
      </div>
    </form>
  );
}

// ── Logo Tab ──────────────────────────────────────────────────────────────────
function LogoTab({ company }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const mutation = useMutation({
    mutationFn: (formData) => companyApi.uploadLogo(formData),
    onSuccess: () => {
      toast.success('Logo uploaded successfully');
      setPreview(null);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['company-profile'] });
    },
    onError: () => toast.error('Failed to upload logo'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('logo', selectedFile);
    mutation.mutate(formData);
  };

  const handleClearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const currentLogo = company?.logoUrl ?? company?.logo;

  return (
    <div className="space-y-6">
      {/* Current Logo */}
      {currentLogo && !preview && (
        <div>
          <p className="label mb-3">Current Logo</p>
          <div className="w-32 h-32 rounded-2xl border-2 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
            <img src={currentLogo} alt="Company logo" className="w-full h-full object-contain p-2" />
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div>
          <p className="label mb-3">Preview</p>
          <div className="relative w-32 h-32">
            <div className="w-32 h-32 rounded-2xl border-2 border-primary-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              <img src={preview} alt="Logo preview" className="w-full h-full object-contain p-2" />
            </div>
            <button
              onClick={handleClearPreview}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 shadow-sm transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}

      {/* Upload Area */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="logo-upload"
        />

        {!preview ? (
          <label
            htmlFor="logo-upload"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors group"
          >
            <Upload size={28} className="text-gray-300 group-hover:text-primary-500 mb-2 transition-colors" />
            <p className="text-sm font-medium text-gray-500 group-hover:text-primary-600 transition-colors">
              Click to upload logo
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, WEBP — max 5 MB</p>
          </label>
        ) : (
          <label
            htmlFor="logo-upload"
            className="btn-secondary text-sm px-4 py-2 cursor-pointer inline-flex items-center gap-2"
          >
            <Upload size={14} />
            Choose Different Image
          </label>
        )}
      </div>

      {/* Upload Button */}
      {selectedFile && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={mutation.isPending}
            className="btn-primary flex items-center gap-2 px-6 py-2 text-sm"
          >
            {mutation.isPending ? <Spinner size="sm" /> : <Upload size={15} />}
            {mutation.isPending ? 'Uploading...' : 'Upload Logo'}
          </button>
          <button
            onClick={handleClearPreview}
            className="btn-secondary text-sm px-4 py-2"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
        </div>
      )}

      {!currentLogo && !preview && (
        <p className="text-sm text-gray-400">No logo uploaded yet.</p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('profile');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companyApi.getProfile().then((r) => r.data),
  });

  const company = data?.data ?? data;

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-gray-900 font-semibold">Failed to load company profile</p>
          <p className="text-sm text-gray-500">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  const activeTabCfg = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your company profile, contact info, and AI configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
          {activeTabCfg && <activeTabCfg.icon size={18} className="text-primary-600" />}
          <h2 className="text-base font-semibold text-gray-900">{activeTabCfg?.label}</h2>
        </div>

        {activeTab === 'profile'  && <ProfileTab    company={company} />}
        {activeTab === 'contact'  && <ContactTab    company={company} />}
        {activeTab === 'ai'       && <AISettingsTab company={company} />}
        {activeTab === 'logo'     && <LogoTab       company={company} />}
      </div>
    </div>
  );
}
