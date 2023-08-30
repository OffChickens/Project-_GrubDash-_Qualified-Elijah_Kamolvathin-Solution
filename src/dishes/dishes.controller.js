const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list( req, res ) {
    const {dishId} = req.params;
    res.json({ data: dishes.filter(dishId ? dish => dish.id == dishId : () => true) })
};

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const {data = {}} = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    }
};

function create (req, res) {
    const { data: {name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function nameIsValid(req, res, next) {
    const { data: {name} = {} } = req.body;
    if (!name) {
        next({
            status: 400,
            message: `Name property cannot be empty.`
        })
    }
    return next()
}

function descriptionIsValid(req, res, next) {
    const { data: {description} = {} } = req.body;
    if(!description) {
        next({
            status: 400,
            message: `Description property cannot be empty`
        })
    }
    return next();
}

function priceIsValid(req, res, next) {
    const { data: {price} = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        next({
            status: 400,
            message: `Value of the price must be a number greater than zero.`
        });
    }
    next();
}

function imageIsValid(req, res, next) {
    const { data: {image_url} = {} } = req.body;
    if(!image_url) {
        next({
            status: 400,
            message: `Description image_url cannot be empty`
        })
    }
    return next();
}

function updateIdVerification(req, res, next){
    const {dishId} = req.params;
    const { data: {id} = {} } = req.body;
    if (!id) {
        next();
    }
    if (id !== dishId) {
        next({
            status: 400,
            message: `id must match the original: ${id}`,
        })
    }
    next();
}

function dishExists (req, res, next) {
    const {dishId} = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`
    });
}

function read (req, res) {
    res.json({data: res.locals.dish});
}

function update (req, res) {
    const dish = res.locals.dish;
    const { data: {name, description, price, image_url} = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        nameIsValid,
        descriptionIsValid,
        priceIsValid,
        imageIsValid,
        create
    ],
    list,
    read: [
        dishExists,
        read
    ],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        nameIsValid,
        descriptionIsValid,
        priceIsValid,
        imageIsValid,
        updateIdVerification,
        update
    ],
};