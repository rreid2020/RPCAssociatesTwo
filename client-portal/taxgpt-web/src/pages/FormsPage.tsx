import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const FORMS_MODULE_ENABLED = import.meta.env.VITE_FORMS_MODULE_ENABLED !== 'false';

type FormSummary = {
  formCode: string;
  formName: string;
  category: string;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastReviewedAt?: string;
  hasInternalSources?: boolean;
};

export default function FormsPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = new Set(forms.map((form) => form.category));
    return ['all', ...Array.from(unique)];
  }, [forms]);

  useEffect(() => {
    if (!FORMS_MODULE_ENABLED) {
      return;
    }

    const controller = new AbortController();
    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (category !== 'all') params.set('category', category);
        const response = await fetch(`${API_URL}/api/forms?${params.toString()}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to load forms');
        }
        const data = (await response.json()) as FormSummary[];
        setForms(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Unable to load forms right now.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
    return () => controller.abort();
  }, [query, category]);

  if (!FORMS_MODULE_ENABLED) {
    return (
      <div className="rounded-md border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#333333]">Tax Form Guidance</h1>
        <p className="mt-2 text-sm text-[#666666]">
          The forms module is currently disabled. Set VITE_FORMS_MODULE_ENABLED=true to enable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-[#e0e0e0] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#333333]">Tax Form Guidance</h1>
            <p className="mt-2 text-sm text-[#666666]">
              Browse CRA form guidance and find citations tied to our repository.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by form code or name"
            className="w-full max-w-sm rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[#333333] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e0e0e0]"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[#333333] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e0e0e0]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border border-[#e0e0e0] bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-[#666666]">Loading forms…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : forms.length === 0 ? (
          <p className="text-sm text-[#666666]">No forms found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((form) => (
              <div key={form.formCode} className="rounded-md border border-[#e0e0e0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#666666]">
                      {form.formCode}
                    </p>
                    <h2 className="text-lg font-semibold text-[#333333]">{form.formName}</h2>
                    <p className="mt-1 text-sm text-[#666666]">{form.category}</p>
                  </div>
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                      form.riskLevel === 'high'
                        ? 'bg-red-100 text-red-700'
                        : form.riskLevel === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#f9f7f6] text-[#183956]'
                    }`}
                  >
                    {form.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#666666]">{form.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#666666]">
                  {form.hasInternalSources ? (
                    <span className="rounded-md bg-[#f9f7f6] px-2 py-1 text-[#183956]">
                      CRA-referenced
                    </span>
                  ) : (
                    <span className="rounded-md bg-[#f9f7f6] px-2 py-1">External CRA links</span>
                  )}
                  {form.lastReviewedAt && (
                    <span>Last reviewed {new Date(form.lastReviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    to={`/forms/${encodeURIComponent(form.formCode)}`}
                    className="inline-flex items-center rounded-md border border-[#183956] px-3 py-2 text-xs font-semibold text-[#183956] hover:bg-[#f9f7f6]"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
