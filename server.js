const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 5000;

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password: "rjmr4781",
    database: "products",
    port: 5433,
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    try {
        const productResult = await pool.query('SELECT * FROM products WHERE purchased = false');
        const productItems = productResult.rows;

        const purchasedProductResult = await pool.query('SELECT * FROM products WHERE purchased = true');
        const purchasedProductItems = purchasedProductResult.rows;

        const categoryResult = await pool.query('SELECT * FROM categories');
        const categoryItems = categoryResult.rows;

        res.render('index', { productItems, purchasedProductItems, categoryItems });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/addCategory', async (req, res) => {
    const { category_name } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO categories (category_name) VALUES ($1)', [category_name]);
        await client.query('COMMIT');
        res.redirect('/');
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(`Internal Server Error: ${err.message}`);
    } finally {
        client.release();
    }
});

app.post('/deleteCategory', async (req, res) => {
    const { category_name } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM categories WHERE category_name = $1', [category_name]);
        await client.query('COMMIT');
        res.redirect('/');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    } finally {
        client.release();
    }
});

app.post('/addProduct', async (req, res) => {
    const { 商品名, 値段, 説明, カテゴリー名 } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('SELECT * FROM products WHERE カテゴリー名 = $1 FOR UPDATE', [カテゴリー名]);
        await client.query('INSERT INTO products (商品名, 値段, 説明, カテゴリー名) VALUES ($1, $2, $3, $4)',
            [商品名, 値段, 説明, カテゴリー名]);
        await client.query('COMMIT');
        res.redirect('/');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    } finally {
        client.release();
    }
});

app.post('/deleteProduct', async (req, res) => {
    const { 商品名, カテゴリー名} = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        if (商品名) {
            await client.query('DELETE FROM products WHERE 商品名 = $1', [商品名]);
        } else if (カテゴリーid) {
            await client.query('DELETE FROM products WHERE カテゴリー名 = $1', [カテゴリー名]);
        }
        await client.query('COMMIT');
        res.redirect('/');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    } finally {
        client.release();
    }
});

app.post('/buyProduct', async (req, res) => {
    const { 商品名 } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('UPDATE products SET purchased = true WHERE 商品名 = $1', [商品名]);
        await client.query('COMMIT');
        res.redirect('/');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    } finally {
        client.release();
    }
});

app.post('/cancelPurchase', async (req, res) => {
    const { 商品名 } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('UPDATE products SET purchased = false WHERE 商品名 = $1', [商品名]);
        await client.query('COMMIT');
        res.redirect('/');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    } finally {
        client.release();
    }
});

app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で実行中`);
});