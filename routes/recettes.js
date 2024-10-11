const express = require('express');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../data'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM recettes';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

router.post('/', upload.single('image'), (req, res) => {
    const { nom, description, temps_preparation, temps_cuisson } = req.body;
    const image = req.file ? `/data/${req.file.filename}` : null;

    const sql = 'INSERT INTO recettes (nom, image, description, temps_preparation, temps_cuisson) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nom, image, description, temps_preparation, temps_cuisson], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Recette ajoutée avec succès', id: result.insertId });
    });
});

router.put('/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { nom, description, temps_preparation, temps_cuisson } = req.body;
    const image = req.file ? `/data/${req.file.filename}` : null;

    let sql = 'UPDATE recettes SET nom = ?, description = ?, temps_preparation = ?, temps_cuisson = ?';
    const params = [nom, description, temps_preparation, temps_cuisson];

    if (image) {
        sql += ', image = ?';
        params.push(image);
    }
    sql += ' WHERE id = ?';
    params.push(id);

    db.query(sql, params, (err) => {
        if (err) throw err;
        res.send({ message: 'Recette mise à jour avec succès' });
    });
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM recettes WHERE id = ?';
    db.query(sql, [id], (err) => {
        if (err) throw err;
        res.send({ message: 'Recette supprimée avec succès' });
    });
});

module.exports = router;