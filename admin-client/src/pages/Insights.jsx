import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Button, Paper, Box, Divider, Skeleton, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { insightsAPI } from '../api/Client.js';

const TallyProgressBar = ({ label, percentage, count }) => (
  <Box sx={{ 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    mb: 1.5, position: 'relative', overflow: 'hidden',
    border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#ffffff'
  }}>
    <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percentage}%`, bgcolor: '#F1F5F9', zIndex: 0 }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', p: 1.5, zIndex: 1 }}>
      <Typography variant="body1" sx={{ color: '#334155' }}>{label}</Typography>
      <Box display="flex" gap={3} alignItems="center">
        <Typography variant="body2" sx={{ color: '#64748B', minWidth: '30px', textAlign: 'right' }}>{percentage}%</Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8', minWidth: '80px', textAlign: 'right' }}>{count} response{count !== 1 ? 's' : ''}</Typography>
      </Box>
    </Box>
  </Box>
);

export default function Insights() {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textModal, setTextModal] = useState(null);

  useEffect(() => { loadInsights(); }, [id]);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await insightsAPI.get(id);
      setQuestions(Array.isArray(data.insights) ? data.insights : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const totalResponses = questions.reduce((max, q) => Math.max(max, q.total_answers || 0), 0);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Button component={Link} to={`/campaigns/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
        Back to Overview
      </Button>

      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold">Analytics & Insights</Typography>
        <Typography color="text.secondary">
          {!isLoading ? `Based on ${totalResponses} total responses` : 'Loading...'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" flexDirection="column" gap={3}>
          {[1, 2, 3].map(i => (
            <Box key={i}>
              <Skeleton variant="text" width={300} height={30} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={45} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={45} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={45} />
            </Box>
          ))}
        </Box>
      ) : questions.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <Typography color="text.secondary">No data to analyze yet.</Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={4}>
          {questions.map((q, index) => {
            if (q.type === 'single_choice' || q.type === 'multi_choice') {
              const totalForQ = q.total_answers || 1;
              const stats = Object.entries(q.counts || {})
                .map(([option, count]) => ({ option, count, percentage: Math.round((count / totalForQ) * 100) }))
                .sort((a, b) => b.count - a.count);

              return (
                <Box key={q._id}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={0.5}>{index + 1}. {q.text}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>{q.total_answers} responses</Typography>
                  {stats.map((stat, i) => (
                    <TallyProgressBar key={i} label={stat.option} percentage={stat.percentage} count={stat.count} />
                  ))}
                  <Divider sx={{ mt: 4 }} />
                </Box>
              );
            }

            if (q.type === 'rating') {
              const totalForQ = q.total_answers || 1;
              const distEntries = Object.entries(q.distribution || {})
                .map(([value, count]) => ({ value: Number(value), count, percentage: Math.round((count / totalForQ) * 100) }))
                .sort((a, b) => a.value - b.value);

              return (
                <Box key={q._id}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={0.5}>{index + 1}. {q.text}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {q.total_answers} responses · Average: <strong>{q.average?.toFixed(1) || 'N/A'}</strong>
                  </Typography>
                  {distEntries.map((d, i) => (
                    <TallyProgressBar key={i} label={`Rating ${d.value}`} percentage={d.percentage} count={d.count} />
                  ))}
                  <Divider sx={{ mt: 4 }} />
                </Box>
              );
            }

            // Text questions — show 2 previews + "Show All" button
            const allTexts = q.texts || [];
            const previewTexts = allTexts.slice(0, 2);

            return (
              <Box key={q._id}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main" mb={0.5}>{index + 1}. {q.text}</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>{q.total_answers} responses</Typography>
                {previewTexts.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {previewTexts.map((answer, i) => (
                      <Paper key={i} elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.primary">{answer}</Typography>
                      </Paper>
                    ))}
                    {allTexts.length > 2 && (
                      <Button
                        variant="outlined" size="small"
                        onClick={() => setTextModal({ text: q.text, texts: allTexts })}
                        sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      >
                        Show All {allTexts.length} Responses
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
                    <Typography color="text.secondary" fontStyle="italic">No text responses yet.</Typography>
                  </Paper>
                )}
                <Divider sx={{ mt: 4 }} />
              </Box>
            );
          })}
        </Box>
      )}

      {/* Text responses modal */}
      <Dialog open={!!textModal} onClose={() => setTextModal(null)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold" borderBottom="1px solid #E2E8F0">
          All Text Responses
          <Typography variant="body2" color="text.secondary" mt={0.5}>{textModal?.text}</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box display="flex" flexDirection="column" gap={2.5}>
            {textModal?.texts.map((answer, i) => (
              <Paper key={i} elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1 }}>
                <Typography variant="body2" color="text.primary">
                  <strong style={{ color: '#64748B' }}>#{i + 1}</strong> &nbsp; {answer}
                </Typography>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setTextModal(null)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}