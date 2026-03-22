import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Typography, Button, Box, Skeleton, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useParams, Link, useNavigate, useBlocker } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { questionsAPI, campaignsAPI } from '../api/Client.js';
import QuestionEditor from '../components/QuestionEditor.jsx'; 

export default function ManageQuestions() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [campaignMode, setCampaignMode] = useState('draft');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [questionsRes, campaignRes] = await Promise.all([
        questionsAPI.list(id),
        campaignsAPI.get(id),
      ]);
      const qs = questionsRes.questions;
      const initial = qs.length > 0 ? qs : [{ _id: Date.now().toString(), type: 'text', text: '', options: [] }];
      setQuestions(initial);
      setSavedSnapshot(JSON.stringify(initial));
      setCampaignMode(campaignRes.campaign.mode);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isDraft = campaignMode === 'draft';
  const hasUnsavedChanges = isDraft && !isLoading && JSON.stringify(questions) !== savedSnapshot;

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Also warn on browser tab close / refresh
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const invalid = questions.find(q => !q.text.trim());
    if (invalid) {
      setError("All questions must have text. Please fill in the empty question(s).");
      return;
    }

    const badChoice = questions.find(q => q.type.includes('choice') && q.options.filter(o => o.trim()).length < 2);
    if (badChoice) {
      setError("Choice questions need at least 2 non-empty options.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = questions.map((q, i) => ({
        type: q.type,
        text: q.text.trim(),
        options: q.type.includes('choice') ? q.options.filter(o => o.trim()) : [],
        order: i,
      }));
      const data = await questionsAPI.update(id, payload);
      setQuestions(data.questions);
      setSavedSnapshot(JSON.stringify(data.questions));
      setSuccess("Questionnaire saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setError(null);
    try {
      const data = await questionsAPI.generate(id, aiPrompt);
      const aiQuestions = data.questions.map((q, i) => ({
        _id: `ai_${Date.now()}_${i}`,
        ...q
      }));
      setQuestions(aiQuestions);
      setIsAiModalOpen(false);
      setAiPrompt("");
      setSuccess("AI generated questions successfully! Review them and click Save All.");
    } catch (err) {
      setError(err.message || "Failed to generate questions using AI.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const addEmptyQuestion = () => {
    setQuestions([...questions, { _id: Date.now().toString(), type: 'text', text: '', options: [] }]);
  };

  const removeQuestion = (qId) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q._id !== qId));
  };

  const updateQuestion = (qId, field, value) => {
    setQuestions(questions.map(q => q._id === qId ? { ...q, [field]: value } : q));
  };

  const addOption = (qId) => {
    setQuestions(questions.map(q => q._id === qId ? { ...q, options: [...q.options, ''] } : q));
  };

  const updateOption = (qId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q._id === qId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (qId, optionIndex) => {
    setQuestions(questions.map(q => {
      if (q._id === qId) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Skeleton variant="text" width={180} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={60} sx={{ mb: 2 }} />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Button component={Link} to={`/campaigns/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
        Back to Overview
      </Button>

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" fontWeight="bold">Questionnaire Builder</Typography>
          {hasUnsavedChanges && (
            <Typography variant="caption" color="warning.main" fontWeight="bold" sx={{ bgcolor: 'warning.light', px: 1, py: 0.5, borderRadius: 1, opacity: 0.8 }}>
              Unsaved
            </Typography>
          )}
        </Box>
        {isDraft && (
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button variant="outlined" color="primary" startIcon={<AutoAwesomeIcon />} onClick={() => setIsAiModalOpen(true)} disabled={isSaving || isAiGenerating}>
              Generate
            </Button>
            <Button variant="contained" color="primary" startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={isSaving || isAiGenerating}>
              Save All
            </Button>
          </Box>
        )}
      </Box>

      {!isDraft && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This campaign is active. Questions are now read-only.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Box display="flex" flexDirection="column" gap={4} mb={4}>
        {questions.map((q, i) => (
          <QuestionEditor
            key={q._id}
            index={i}
            question={q}
            onRemove={() => removeQuestion(q._id)}
            onUpdate={(field, value) => updateQuestion(q._id, field, value)}
            onAddOption={() => addOption(q._id)}
            onUpdateOption={(optIndex, value) => updateOption(q._id, optIndex, value)}
            onRemoveOption={(optIndex) => removeOption(q._id, optIndex)}
            disabled={!isDraft}
          />
        ))}
      </Box>
      
      {isDraft && (
        <Button variant="outlined" color="primary" fullWidth startIcon={<AddCircleOutlineIcon />} onClick={addEmptyQuestion} sx={{ py: 2, borderStyle: 'dashed', borderWidth: 2 }}>
          Add Another Question
        </Button>
      )}

      {/* Unsaved changes warning modal */}
      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset()}>
        <DialogTitle fontWeight="bold">Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes to your questionnaire. If you leave now, your edits will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => blocker.reset()} variant="contained" color="primary">
            Stay & Edit
          </Button>
          <Button onClick={() => blocker.proceed()} color="error">
            Discard & Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Generate Modal */}
      <Dialog open={isAiModalOpen} onClose={() => !isAiGenerating && setIsAiModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold" display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon color="primary" /> Generate Questions with AI
        </DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Describe your organization and tell us about your feedback campaign. The AI will generate up to 5 varied questions for you.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Organization details and feedback requirements.."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isAiGenerating}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsAiModalOpen(false)} color="inherit" disabled={isAiGenerating}>
            Cancel
          </Button>
          <Button onClick={handleAiGenerate} variant="contained" color="primary" disabled={!aiPrompt.trim() || isAiGenerating} startIcon={isAiGenerating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}>
            {isAiGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}