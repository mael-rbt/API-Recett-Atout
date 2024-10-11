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
    const sql = `
        SELECT 
            r.id AS recette_id, 
            r.nom AS recette_nom, 
            r.image AS recette_image, 
            r.description AS recette_description,
            r.temps_preparation, 
            r.temps_cuisson,
            i.id AS ingredient_id, 
            i.nom AS ingredient_nom, 
            ri.quantite
        FROM recettes r
        JOIN recettes_ingredients ri ON r.id = ri.recette_id
        JOIN ingredients i ON i.id = ri.ingredient_id
    `;
    
    db.query(sql, (err, result) => {
        if (err) throw err;
        
        // Organiser le résultat en format JSON propre
        const recettes = result.reduce((acc, row) => {
            const { recette_id, recette_nom, recette_image, recette_description, temps_preparation, temps_cuisson, ingredient_id, ingredient_nom, quantite, unite } = row;
            
            // Vérifie si la recette existe déjà dans l'accumulateur
            if (!acc[recette_id]) {
                acc[recette_id] = {
                    id: recette_id,
                    nom: recette_nom,
                    image: recette_image,
                    description: recette_description,
                    temps_preparation,
                    temps_cuisson,
                    ingredients: []
                };
            }

            // Ajoute l'ingrédient à la liste d'ingrédients de la recette
            acc[recette_id].ingredients.push({
                id: ingredient_id,
                nom: ingredient_nom,
                quantite
            });

            return acc;
        }, {});

        // Convertit l'objet en tableau
        const response = Object.values(recettes);

        res.send(response);
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