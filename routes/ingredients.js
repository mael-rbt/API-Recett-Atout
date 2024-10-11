const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM ingredients';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

router.post('/', (req, res) => {
    const { nom } = req.body;
    const sql = 'INSERT INTO ingredients (nom) VALUES (?)';
    db.query(sql, [nom], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Ingrédient ajouté avec succès', id: result.insertId });
    });
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nom } = req.body;
    const sql = 'UPDATE ingredients SET nom = ? WHERE id = ?';
    db.query(sql, [nom, id], (err) => {
        if (err) throw err;
        res.send({ message: 'Ingrédient mis à jour avec succès' });
    });
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM ingredients WHERE id = ?';
    db.query(sql, [id], (err) => {
        if (err) throw err;
        res.send({ message: 'Ingrédient supprimé avec succès' });
    });
});

module.exports = router;
