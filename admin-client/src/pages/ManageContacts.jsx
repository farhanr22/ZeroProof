import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Alert, Box, CircularProgress, Skeleton } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import * as XLSX from 'xlsx';
import { contactsAPI, campaignsAPI } from '../api/Client.js';
import ContactList from '../components/ContactList.jsx';

export default function ManageContacts() {
  const { id } = useParams();

  const [bulkInput, setBulkInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [campaignMode, setCampaignMode] = useState('draft');
  const [otpServiceEnabled, setOtpServiceEnabled] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [contactsRes, campaignRes] = await Promise.all([
        contactsAPI.list(id),
        campaignsAPI.get(id),
      ]);
      setContacts(contactsRes.contacts);
      setCampaignMode(campaignRes.campaign.mode);
      if (campaignRes.config) setOtpServiceEnabled(campaignRes.config.otp_service_enabled);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isDraft = campaignMode === 'draft';

  // --- File Upload Handler (Supports TXT, CSV, XLSX) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'txt') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const textContent = evt.target.result;
        setBulkInput(prev => prev ? prev + '\n' + textContent : textContent);
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const extractedNumbers = jsonData
            .map(row => row[0])
            .filter(val => val !== undefined && val !== null && val !== '')
            .join('\n');
          setBulkInput(prev => prev ? prev + '\n' + extractedNumbers : extractedNumbers);
        } catch (err) {
          setError("Failed to read the Excel/CSV file. Please ensure it is a valid format.");
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleBulkAdd = async () => {
    setError(null);
    const rawLines = bulkInput.split('\n').map(v => v.trim()).filter(v => v);
    let validValues = [];
    let invalidCount = 0;

    rawLines.forEach(line => {
      // Strip any non-digit characters, then check it's a pure digit string
      const digits = line.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        validValues.push(digits);
      } else {
        invalidCount++;
      }
    });

    if (validValues.length === 0) {
      setError(`No valid numbers found. ${invalidCount} invalid entries ignored.`);
      return;
    }

    setIsAdding(true);
    try {
      await contactsAPI.add(id, validValues);
      // Reload contacts from server to get the real _id values
      const data = await contactsAPI.list(id);
      setContacts(data.contacts);
      setBulkInput('');
      if (invalidCount > 0) {
        setError(`Added ${validValues.length} contacts. Ignored ${invalidCount} invalid numbers.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (contactId) => {
    try {
      await contactsAPI.delete(id, contactId);
      setContacts(contacts.filter(c => c._id !== contactId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Button component={Link} to={`/campaigns/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
        Back to Overview
      </Button>

      <Typography variant="h4" fontWeight="bold" mb={1}>Manage Respondent List</Typography>
      <Typography color="text.secondary" mb={4}>
        Enter numbers manually one by one, or upload a .TXT, .CSV, or .XLSX file to auto-fill the list.
      </Typography>

      {!isDraft && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This campaign is active. Contact list is now read-only.
        </Alert>
      )}

      {error && <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {!otpServiceEnabled && !isDraft && (
        <Alert
          severity="info"
          sx={{ mb: 4, '& .MuiAlert-message': { width: '100%' } }}
          variant="outlined"
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Manual Link Distribution Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            The automatic OTP Sender service is currently not operational. You will need to forward the secure one-time links (shown in the table below) to the respondents yourself.
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Respondents can enter these secure links in the client application:
            <br />
            <Box
              component="a"
              href="https://farhanr22.github.io/ZeroProof/"
              target="_blank"
              sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              farhanr22.github.io/ZeroProof/ 🔗
            </Box>
          </Typography>
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={60} />
          <Skeleton variant="rounded" height={200} />
        </Box>
      ) : (
        <>
          {isDraft && (
            <Paper elevation={0} sx={{ p: 0, mb: 4, border: 'none' }}>
              <input
                type="file"
                accept=".txt, text/plain, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <TextField
                label="Enter mobile numbers (or upload file)"
                multiline rows={6} fullWidth variant="outlined"
                placeholder={"e.g. 919876543210\n(Write one per line, include country code, no spaces)"}
                value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}
                sx={{ mb: 3, fontFamily: 'monospace' }}
              />

              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  startIcon={isUploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading || isAdding}
                  sx={{ flex: 1 }}
                >
                  Upload TXT / Excel
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={isAdding ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                  onClick={handleBulkAdd}
                  disabled={!bulkInput.trim() || isUploading || isAdding}
                  sx={{ flex: 1 }}
                >
                  Parse and Add Contacts
                </Button>
              </Box>
            </Paper>
          )}

          <Typography variant="h6" fontWeight="bold" mb={2}>Authorized Numbers ({contacts.length})</Typography>

          <ContactList contacts={contacts} onDelete={handleDelete} disabled={!isDraft} />
        </>
      )}
    </Container>
  );
}