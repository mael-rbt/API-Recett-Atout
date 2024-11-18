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
            r.instruction AS recette_instruction,
            r.temps_preparation, 
            r.temps_cuisson,
            i.id AS ingredient_id, 
            i.nom AS ingredient_nom, 
            ri.quantite
        FROM recettes r
        JOIN recettes_ingredients ri ON r.id = ri.recette_id
        JOIN ingredients i ON i.id = ri.ingredient_id`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        
        // Organiser le résultat en format JSON propre
        const recettes = result.reduce((acc, row) => {
            const { recette_id, recette_nom, recette_image, recette_description, recette_instruction, temps_preparation, temps_cuisson, ingredient_id, ingredient_nom, quantite } = row;
            
            // Vérifie si la recette existe déjà dans l'accumulateur
            if (!acc[recette_id]) {
                acc[recette_id] = {
                    id: recette_id,
                    nom: recette_nom,
                    image: recette_image,
                    description: recette_description,
                    instruction: recette_instruction,
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
    const { nom, description, instruction, temps_preparation, temps_cuisson, ingredients } = req.body;
    console.log('Ajout de recette : '+nom)
    const image = req.file ? `/data/${req.file.filename}` : '/';

    let ingredientsList = [];
    try {
        // Vérifier si ingredients est déjà un objet JSON
        ingredientsList = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
    } catch (error) {
        return res.status(400).send({ message: 'Format d\'ingrédients incorrect' });
    }

    if (!Array.isArray(ingredientsList) || ingredientsList.length === 0) {
        return res.status(400).send({ message: 'Les ingrédients sont requis pour cette recette' });
    }

    const sqlRecette = 'INSERT INTO recettes (nom, image, description, instruction, temps_preparation, temps_cuisson) VALUES (?, ?, ?, ?, ?, ?)';
    db.beginTransaction((err) => {
        if (err) throw err;

        db.query(sqlRecette, [nom, image, description, instruction, temps_preparation, temps_cuisson], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    throw err;
                });
            }

            const recetteId = result.insertId;
            const sqlIngredient = 'INSERT INTO recettes_ingredients (recette_id, ingredient_id, quantite) VALUES ?';

            const ingredientsData = ingredientsList.map(ingredient => [
                recetteId,
                ingredient.id,
                ingredient.quantite
            ]);

            db.query(sqlIngredient, [ingredientsData], (err) => {
                if (err) {
                    return db.rollback(() => {
                        throw err;
                    });
                }
                
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            throw err;
                        });
                    }
                    res.send({ message: 'Recette ajoutée avec succès', id: recetteId });
                });
            });
        });
    });
});


router.put('/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { nom, description, instruction, temps_preparation, temps_cuisson } = req.body;
    const image = req.file ? `/data/${req.file.filename}` : null;

    let sql = 'UPDATE recettes SET nom = ?, description = ?, instruction = ?, temps_preparation = ?, temps_cuisson = ?';
    const params = [nom, description, instruction, temps_preparation, temps_cuisson];

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