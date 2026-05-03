const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'recipes.json');

app.use(express.json());
app.use(express.static(__dirname));

// --- Helpers ---
function readRecipes() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeRecipes(recipes) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2));
}

function sanitize({ name, cost, servings, ingredients }) {
  return {
    name: String(name || '').trim().slice(0, 80),
    cost: Math.max(0, parseFloat(cost) || 0),
    servings: Math.max(1, parseInt(servings, 10) || 1),
    ingredients: Array.isArray(ingredients)
      ? ingredients.map(i => String(i).trim()).filter(Boolean)
      : [],
  };
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// --- Routes ---
app.get('/api/recipes', (req, res) => {
  res.json(readRecipes());
});

app.post('/api/recipes', (req, res) => {
  const recipes = readRecipes();
  const recipe = { id: uid(), ...sanitize(req.body) };
  recipes.push(recipe);
  writeRecipes(recipes);
  res.status(201).json(recipe);
});

app.put('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const idx = recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  recipes[idx] = { id: req.params.id, ...sanitize(req.body) };
  writeRecipes(recipes);
  res.json(recipes[idx]);
});

app.delete('/api/recipes/:id', (req, res) => {
  let recipes = readRecipes();
  if (!recipes.some(r => r.id === req.params.id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  recipes = recipes.filter(r => r.id !== req.params.id);
  writeRecipes(recipes);
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Family Notes running on http://localhost:${PORT}`));
