import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Target, CheckCircle, Calendar, Trash2, Edit2,
  ChevronDown, ChevronUp, FolderOpen
} from 'lucide-react';
import { milestonesApi, projectsApi } from '../../api/index';
import { Spinner } from '../../components/common/index';

function ProgressBar({ value }) {
  const color = value >= 100 ? 'bg-green-500' : value >= 50 ? 'bg-blue-500' : 'bg-orange-400';
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function MilestonesPage() {
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: projRes } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectsApi.getAll({ pageSize: 100 }),
  });
  const projects = projRes?.data?.data?.items ?? projRes?.data?.data ?? [];

  const { data: milRes, isLoading } = useQuery({
    queryKey: ['milestones', selectedProject],
    queryFn: () => milestonesApi.getByProject(selectedProject),
    enabled: !!selectedProject,
  });
  const milestones = milRes?.data?.data ?? [];

  const createM = useMutation({
    mutationFn: (data) => milestonesApi.create(data),
    onSuccess: () => { toast.success('تم إنشاء المرحلة'); qc.invalidateQueries(['milestones']); setShowForm(false); reset(); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });
  const updateM = useMutation({
    mutationFn: ({ id, data }) => milestonesApi.update(id, data),
    onSuccess: () => { toast.success('تم التحديث'); qc.invalidateQueries(['milestones']); setEditing(null); reset(); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });
  const deleteM = useMutation({
    mutationFn: (id) => milestonesApi.delete(id),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries(['milestones']); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });
  const completeM = useMutation({
    mutationFn: (id) => milestonesApi.complete(id),
    onSuccess: () => { toast.success('تم إكمال المرحلة ✓'); qc.invalidateQueries(['milestones']); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });

  const onSubmit = (data) => {
    const payload = { ...data, projectId: selectedProject, dueDate: new Date(data.dueDate).toISOString() };
    if (editing) {
      updateM.mutate({ id: editing.id, data: payload });
    } else {
      createM.mutate(payload);
    }
  };

  const startEdit = (m) => {
    setEditing(m);
    setValue('name', m.name);
    setValue('description', m.description ?? '');
    setValue('dueDate', m.dueDate?.substring(0, 10));
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditing(null); reset(); };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المراحل (Milestones)</h1>
          <p className="text-gray-500 text-sm">تتبع تقدم مراحل مشاريعك</p>
        </div>
        {selectedProject && (
          <button
            onClick={() => { setShowForm(s => !s); setEditing(null); reset(); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
          >
            <Plus size={16} />
            مرحلة جديدة
          </button>
        )}
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <FolderOpen size={15} /> اختر المشروع
        </label>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="input"
        >
          <option value="">-- اختر مشروعاً --</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-blue-100">
          <h2 className="font-bold text-gray-800 mb-4">
            {editing ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">اسم المرحلة *</label>
                <input
                  className={`input ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="مثال: تسليم النموذج الأولي"
                  {...register('name', { required: 'مطلوب' })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">تاريخ الاستحقاق *</label>
                <input
                  type="date"
                  className={`input ${errors.dueDate ? 'border-red-400' : ''}`}
                  {...register('dueDate', { required: 'مطلوب' })}
                />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">الوصف</label>
              <textarea
                className="input"
                rows={2}
                placeholder="وصف اختياري للمرحلة..."
                {...register('description')}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createM.isPending || updateM.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {(createM.isPending || updateM.isPending) ? <Spinner size="sm" /> : (editing ? 'حفظ التعديل' : 'إضافة')}
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Milestones List */}
      {!selectedProject ? (
        <div className="text-center py-16 text-gray-400">
          <Target size={48} className="mx-auto mb-3 opacity-30" />
          <p>اختر مشروعاً لعرض مراحله</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Target size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد مراحل لهذا المشروع</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map(m => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl shadow-sm p-5 border-r-4 ${
                m.isCompleted ? 'border-green-400' : new Date(m.dueDate) < new Date() ? 'border-red-400' : 'border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {m.isCompleted
                      ? <CheckCircle size={18} className="text-green-500" />
                      : <Target size={18} className="text-blue-500" />
                    }
                    <h3 className="font-bold text-gray-800">{m.name}</h3>
                    {m.isCompleted && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">مكتملة ✓</span>
                    )}
                  </div>
                  {m.description && <p className="text-sm text-gray-500 mt-1 ms-6">{m.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {!m.isCompleted && (
                    <button
                      onClick={() => completeM.mutate(m.id)}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100"
                    >
                      إكمال ✓
                    </button>
                  )}
                  <button onClick={() => startEdit(m)} className="text-gray-400 hover:text-blue-600">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { if (confirm('حذف المرحلة؟')) deleteM.mutate(m.id); }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{m.completedTasks}/{m.totalTasks} مهام مكتملة</span>
                  <span>{m.progressPercent}%</span>
                </div>
                <ProgressBar value={m.progressPercent} />
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <Calendar size={12} />
                الاستحقاق: {new Date(m.dueDate).toLocaleDateString('ar-EG')}
                {m.completedAt && (
                  <span className="ms-3 text-green-600">
                    • أُكملت: {new Date(m.completedAt).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
