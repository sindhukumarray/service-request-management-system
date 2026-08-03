import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AlertCircle, CheckCircle, FileText, Send, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');

  const [aiSummary, setAiSummary] = useState('');
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState('');
  const [aiSuggestedPriority, setAiSuggestedPriority] = useState('');
  const [aiReason, setAiReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAIAnalyze = async () => {
    if (!title || !description) {
      setError('Please provide both Title and Description before requesting AI analysis.');
      return;
    }
    
    setError(null);
    setLoadingAI(true);

    try {
      // Backend exposes POST /api/ai/analyze-request
      const response = await api.post('/ai/analyze-request', { title, description });

      // aiController returns { summary, suggestedCategory, suggestedPriority, reason }
      const {
        summary,
        suggestedCategory,
        suggestedPriority,
        reason,
      } = response.data;

      const fetchedSummary = summary;
      const fetchedCategory = suggestedCategory;
      const fetchedPriority = suggestedPriority;
      const fetchedReason = reason;

      setAiSummary(fetchedSummary || 'No summary returned');
      setAiSuggestedCategory(fetchedCategory || 'OTHER');
      setAiSuggestedPriority(fetchedPriority || 'MEDIUM');
      setAiReason(fetchedReason || 'No reasoning provided');

      setCategory(fetchedCategory || 'OTHER');
      setPriority(fetchedPriority || 'MEDIUM');
    } catch (err: any) {
      setError(`AI analysis failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingAI(false);
    }
  };

  const submittingRef = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || submittingRef.current) return; // prevent duplicate

    setError(null);
    setSuccess(null);
    setLoading(true);
    submittingRef.current = true;

    try {
      const response = await api.post('/requests', {
        title,
        description,
        category,
        priority,
        aiSummary,
        aiSuggestedCategory,
        aiSuggestedPriority,
      });

      setSuccess(`Request created successfully! Reference: ${response.data.requestNumber}`);
      
      setTitle('');
      setDescription('');
      setCategory('OTHER');
      setPriority('MEDIUM');
      setAiSummary('');
      setAiSuggestedCategory('');
      setAiSuggestedPriority('');
      setAiReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit service request.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1 text-slate-500 hover:text-brand-600 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-brand-100 text-brand-600 p-2.5 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Raise Service Request</h1>
            <p className="text-sm text-slate-500">Submit your ticket with AI-assisted priority suggestions.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-2 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-2 mb-6">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title / Issue Summary *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="e.g., VPN Connection failure at 7 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="Provide logs, error codes, and steps to reproduce."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  >
                    <option value="SOFTWARE">Software Issues</option>
                    <option value="HARDWARE">Hardware Issues</option>
                    <option value="NETWORK">Network / Internet</option>
                    <option value="ACCESS">Access / Permissions</option>
                    <option value="OTHER">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-brand-600 font-bold text-sm">
                <Sparkles className="h-5 w-5" />
                <span>AI Ticket Analyzer</span>
              </div>
              <p className="text-xs text-slate-500">
                Analyze your input to generate a concise summary and suggested configuration metrics.
              </p>

              <button
                type="button"
                onClick={handleAIAnalyze}
                className="w-full flex justify-center items-center space-x-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-sm hover:from-brand-700 hover:to-indigo-700 transition"
              >
                {loadingAI ? (
                  <>
                    <RefreshCw className="animate-spin h-3.5 w-3.5" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Analyze Content</span>
                  </>
                )}
              </button>

              {aiSummary && (
                <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">AI Summary:</span>
                    <span className="text-slate-600 italic">"{aiSummary}"</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Suggested Category:</span>
                    <span className="text-brand-600 font-semibold">{aiSuggestedCategory}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Suggested Priority:</span>
                    <span className="text-brand-600 font-semibold">{aiSuggestedPriority}</span>
                  </div>
                  {aiReason && (
                    <div>
                      <span className="font-semibold text-slate-700 block">AI Reasoning:</span>
                      <p className="text-slate-500 leading-normal">{aiReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md transition"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
