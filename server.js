const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.use('/data', express.static(path.join(__dirname, 'data')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const recetteRoutes = require('./routes/recettes');
const ingredientRoutes = require('./routes/ingredients');
const tagRoutes = require('./routes/tags');

app.use('/recettes', recetteRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/tags', tagRoutes);

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
