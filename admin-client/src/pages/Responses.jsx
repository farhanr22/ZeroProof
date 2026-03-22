import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, Typography, Button, Paper, Box, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Dialog, 
  DialogTitle, DialogContent, DialogActions, Chip, Skeleton, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { responsesAPI, questionsAPI } from '../api/Client.js';

export default function Responses() {
  const { id } = useParams();
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [responsesRes, questionsRes] = await Promise.all([
        responsesAPI.list(id),
        questionsAPI.list(id),
      ]);
      setResponses(responsesRes.responses);
      setQuestions(questionsRes.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to find answer value for a question from a response's answers array
  const getAnswer = (response, questionId) => {
    const answer = response.answers.find(a => a.question_id === questionId);
    if (!answer) return <em>No answer provided</em>;
    
    const val = answer.value;
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Button component={Link} to={`/campaigns/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
        Back to Overview
      </Button>

      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} gap={2} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Collected Responses</Typography>
          <Typography color="text.secondary">Viewing all anonymous submissions for this campaign</Typography>
        </Box>
        {!isLoading && (
          <Chip label={`${responses.length} Total`} color="primary" sx={{ fontWeight: 'bold' }} />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" flexDirection="column" gap={1}>
          <Skeleton variant="rounded" height={50} />
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rounded" height={45} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell><strong>Response</strong></TableCell>
                <TableCell><strong>Submitted Date</strong></TableCell>
                <TableCell align="right"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No responses collected yet.
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((res, idx) => (
                  <TableRow key={res._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>Response #{idx + 1}</TableCell>
                    <TableCell>{new Date(res.submitted_at).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => setSelectedResponse(res)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal to view individual answers */}
      <Dialog open={!!selectedResponse} onClose={() => setSelectedResponse(null)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold" borderBottom="1px solid #E2E8F0">
          Submission Details
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Anonymous response · {selectedResponse && new Date(selectedResponse.submitted_at).toLocaleString()}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, mb:0, pb:1 }}>
          {questions.map((q, index) => (
            <Box key={q._id} mb={2}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" mb={0.5}>
                {index + 1}. {q.text}
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1 }}>
                <Typography variant="body1">
                  {selectedResponse ? getAnswer(selectedResponse, q._id) : ''}
                </Typography>
              </Paper>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setSelectedResponse(null)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}