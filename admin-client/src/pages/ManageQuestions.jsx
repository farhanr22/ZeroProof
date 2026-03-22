import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, Skeleton, Alert, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useParams, Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { questionsAPI, campaignsAPI } from '../api/Client.js';
import QuestionEditor from '../components/QuestionEditor.jsx'; 

export default function ManageQuestions() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [campaignMode, setCampaignMode] = useState('draft');

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
      setQuestions(qs.length > 0 ? qs : [{ _id: Date.now().toString(), type: 'text', text: '', options: [] }]);
      setCampaignMode(campaignRes.campaign.mode);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isDraft = campaignMode === 'draft';

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // Validate: every question must have text
    const invalid = questions.find(q => !q.text.trim());
    if (invalid) {
      setError("All questions must have text. Please fill in the empty question(s).");
      return;
    }

    // Validate: choice questions must have at least 2 options
    const badChoice = questions.find(q => q.type.includes('choice') && q.options.filter(o => o.trim()).length < 2);
    if (badChoice) {
      setError("Choice questions need at least 2 non-empty options.");
      return;
    }

    setIsSaving(true);
    try {
      // Auto-assign order from array position
      const payload = questions.map((q, i) => ({
        type: q.type,
        text: q.text.trim(),
        options: q.type.includes('choice') ? q.options.filter(o => o.trim()) : [],
        order: i,
      }));
      const data = await questionsAPI.update(id, payload);
      setQuestions(data.questions);
      setSuccess("Questionnaire saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
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
        <Typography variant="h4" fontWeight="bold">Questionnaire Builder</Typography>
        {isDraft && (
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
            <Button variant="contained" color="primary" startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} onClick={handleSave} disabled={isSaving}>
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
    </Container>
  );
}