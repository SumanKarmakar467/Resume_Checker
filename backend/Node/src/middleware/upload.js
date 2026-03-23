const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || fileName.endsWith('.pdf');
    const isDocx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx');
    const isTxt = file.mimetype === 'text/plain' || fileName.endsWith('.txt');

    if (!isPdf && !isDocx && !isTxt) {
      cb(new Error('Only PDF, DOCX, and TXT files are supported.'));
      return;
    }
    cb(null, true);
  }
});

module.exports = upload;
