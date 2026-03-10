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

    if (!isPdf && !isDocx) {
      cb(new Error('Only PDF and DOCX files are supported.'));
      return;
    }
    cb(null, true);
  }
});

module.exports = upload;
