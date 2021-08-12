const express = require('express');
const morgan = require('morgan');
const { concatenate } = require('./concatenate.js');
const md5 = require('md5');

const app = express();
morgan(':method :url :status :response-time ms - :res[content-length]');

const PORT = 8002;

app.use(morgan('dev'));
app.use(express.json());

const authMiddleware = (req, res, next) => {
	if (!req.headers.authorization) {
		res.status(403).send({ error: 'No credentials' });
	} else if (req.headers.authorization === '790f2b152ad1010b8db473b206bb6725') {
		res.status(401).send({ error: 'Unauthorized' });
	} else if (req.headers.authorization === '0972164370bb3a0c266fbd18c09c9e87') {
		const authHeader = req.headers.authorization;
		req.customAuthHeader = authHeader;
	}

	next();
};

app.get('/', (_, res) => {
	res.type('html');
	res.send('<h1>My first Express App - Author: Viktor Škifić</h1>');
});

app.get('/not-found', (_, res) => {
	res.type('html');
	res.status(404);
	res.send('<h3>Sorry, Page is not found.</h3>');
});

app.get('/error', (_, res, next) => {
	try {
		throw new Error('Error from /error');
	} catch (err) {
		err.type = 'test';
		next(err);
	}
});

app.get('/student-data', (req, res) => {
	const firstName = req.query.firstName || 'No first name provided.';
	const lastName = req.query.lastName || 'No last name provided.';
	const email = req.query.email || 'No email provided.';
	res.status(200).json({
		concatenatedString: concatenate(firstName, lastName, email),
	});
});

app.get('/private-route', authMiddleware, (req, res) => {
	const authHeaderExist = req.customAuthHeader ? true : false;
	const value = req.customAuthHeader || '';
	res.type('application/json');
	res.send({ authHeaderExist, value });
});

app.post('/authorization', authMiddleware, (req, res) => {
	const hashedString = md5(
		`${req.body.id}_${req.body.firstName}_${req.body.lastName}_${req.body.email}`
	);
	res.header('Authentication', 'Bearer ' + hashedString);
	res.status(200).send({ hash: hashedString });
});

app.use((error, req, res, next) => {
	console.log('Error handling middleware');
	if (error.type === 'test') {
		res.status(408).send(error); // 408 samo za probu
	}
});

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
