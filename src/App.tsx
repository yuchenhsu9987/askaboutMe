import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Container, Typography, TextField, Button, Paper, Alert, ToggleButton, ToggleButtonGroup, IconButton, Divider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DEFAULT_PDF_PATH = '/許育宸.pdf';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const translations = {
  zh: {
    title: 'AskAboutMe - RufusHSU',
    subtitle: '應徵者：許育宸 | Email: rufushsu9987@gmail.com | Phone: 0975-115-201',
    reminder: 'AI生成的回答可能不完全準確，請以PDF文件內容為主要參考依據。',
    inputLabel: '請輸入您的問題',
    submitButton: '提問',
    loading: '處理中...',
    answer: '回答：',
    pdfLoading: 'PDF載入中...',
    page: '第',
    totalPages: '頁，共',
    pages: '頁',
    prevPage: '上一頁',
    nextPage: '下一頁'
  },
  en: {
    title: 'AskAboutMe - RufusHSU',
    subtitle: 'Applicant: Yu-Chen Hsu | Email: rufushsu9987@gmail.com | Phone: 0975-115-201',
    reminder: 'AI-generated answers may not be completely accurate. Please refer to the PDF document as the primary source.',
    inputLabel: 'Enter your question',
    submitButton: 'Ask',
    loading: 'Processing...',
    answer: 'Answer:',
    pdfLoading: 'Loading PDF...',
    page: 'Page',
    totalPages: 'of',
    pages: 'pages',
    prevPage: 'Previous',
    nextPage: 'Next'
  }
};

function App() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [pdfContent, setPdfContent] = useState<string>('');

  const t = translations[language];

  const handlePageTextContent = async (page: any) => {
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str).join(' ');
  };

  const onDocumentLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    let fullText = '';
    const pdf = await pdfjs.getDocument(DEFAULT_PDF_PATH).promise;
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const pageText = await handlePageTextContent(page);
      fullText += ' ' + pageText;
    }
    console.log('提取的完整 PDF 內容:', fullText);
    setPdfContent(fullText);
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: language === 'zh'
                ? `你是一位友善的面試官，正在和臺北大學資工系的許育宸聊天。請用輕鬆的口吻回答問題，分享你對他的經歷和能力的看法。`
                : `You are a friendly interviewer chatting with Yu-Chen Hsu, a Computer Science student at National Taipei University. Please respond in a casual and friendly tone, sharing your thoughts about his experience and abilities.`
            },
            {
              role: "user",
              content: language === 'zh'
                ? `簡歷內容：\n${pdfContent.substring(0, 6000)}\n\n請簡短回答：${question}`
                : `Resume content:\n${pdfContent.substring(0, 6000)}\n\nPlease answer briefly: ${question}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 錯誤:', errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('無效的 API 響應:', data);
        throw new Error('無效的 API 響應格式');
      }

      setAnswer(data.choices[0].message.content);
    } catch (error: any) {
      console.error('詳細錯誤:', error);
      let errorMessage = '';
      
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.error?.message || '未知錯誤';
      } catch {
        errorMessage = error.message || '未知錯誤';
      }

      setAnswer(language === 'zh' 
        ? `抱歉，發生錯誤：${errorMessage}`
        : `Sorry, an error occurred: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (
    event: React.MouseEvent<HTMLElement>,
    newLanguage: 'zh' | 'en',
  ) => {
    if (newLanguage) {
      setLanguage(newLanguage);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleQuestionSubmit();
    }
  };

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = DEFAULT_PDF_PATH;
    link.download = '許育宸_履歷.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl" sx={{ 
      py: 4, 
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <Paper elevation={3} sx={{ 
        p: 4, 
        borderRadius: 2,
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '2px solid #eaeaea',
          pb: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" 
              sx={{ 
                fontWeight: 600,
                color: '#2c3e50',
                mb: 1
              }}>
              {t.title}
            </Typography>
            <Typography variant="subtitle1" 
              sx={{ 
                color: '#34495e',
                fontWeight: 500
              }}>
              {t.subtitle}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={handleLanguageChange}
              aria-label="language"
              sx={{
                '& .MuiToggleButton-root': {
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  '&.Mui-selected': {
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    pointerEvents: 'none'
                  },
                  '&:hover': {
                    backgroundColor: '#34495e',
                    color: 'white'
                  }
                }
              }}
            >
              <ToggleButton value="zh" aria-label="chinese">
                中文
              </ToggleButton>
              <ToggleButton value="en" aria-label="english">
                English
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Alert severity="info" sx={{ 
          mb: 3,
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          '& .MuiAlert-icon': {
            color: '#1976d2'
          }
        }}>
          {t.reminder}
        </Alert>

        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          height: 'calc(100vh - 280px)'
        }}>
          {/* PDF Viewer - Left Side */}
          <Paper elevation={2} sx={{ 
            flex: 0.8, 
            p: 3, 
            overflow: 'auto',
            borderRadius: 2,
            backgroundColor: '#ffffff',
            position: 'relative'
          }}>
            <IconButton
              onClick={handleDownloadPDF}
              sx={{ 
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 1,
                backgroundColor: 'rgba(236, 240, 241, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(189, 195, 199, 0.9)'
                }
              }}
            >
              <DownloadIcon />
            </IconButton>
            <Document
              file={DEFAULT_PDF_PATH}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Typography sx={{ color: '#7f8c8d' }}>{t.pdfLoading}</Typography>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Box key={`page_${index + 1}`} sx={{ mb: 3 }}>
                  <Page
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Box>
              ))}
            </Document>
          </Paper>

          {/* Q&A Section - Right Side */}
          <Box sx={{ 
            flex: 0.6, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3
          }}>
            <Paper elevation={2} sx={{ 
              p: 3,
              borderRadius: 2,
              backgroundColor: '#ffffff'
            }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label={t.inputLabel}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  multiline
                  rows={2}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#2c3e50',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2c3e50',
                      }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleQuestionSubmit}
                  disabled={loading}
                  sx={{ 
                    minWidth: 100,
                    backgroundColor: '#2c3e50',
                    '&:hover': {
                      backgroundColor: '#34495e'
                    }
                  }}
                  endIcon={<SendIcon />}
                >
                  {loading ? t.loading : t.submitButton}
                </Button>
              </Box>
            </Paper>

            {answer && (
              <Paper elevation={2} sx={{ 
                p: 3, 
                flex: 1, 
                overflow: 'auto',
                borderRadius: 2,
                backgroundColor: '#ffffff'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                  {t.answer}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ whiteSpace: 'pre-wrap', color: '#34495e' }}>
                  {answer}
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;