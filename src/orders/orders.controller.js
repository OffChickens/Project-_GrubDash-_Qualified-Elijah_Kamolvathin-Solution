const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list( req, res ) {
    const {orderId} = req.params;
    res.json({ data: orders.filter(orderId ? order => order.id == orderId : () => true) })
};

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    };
};

function create (req, res) {
    const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

function deliverIsValid(req, res, next) {
    const { data: {deliverTo} = {} } = req.body;
    if (!deliverTo) {
        next({
            status: 400,
            message: `Value of the 'deliverTo' property cannot be empty`
        })
    }
    next();
}

function mobileIsValid (req, res, next) {
    const { data: {mobileNumber} = {} } = req.body;
    if (!mobileNumber) {
        next({
            status: 400,
            message: `Value of the 'mobileNumber' property cannot be empty`,
        })
    }
    next();
}

function dishesIsValid (req, res, next) {
    const { data: {dishes} = {} } = req.body;
    if(!Array.isArray(dishes) || dishes.length <= 0) {
        next({
            status: 400,
            message: `Dishes must contain a dish`
        });
    }
    next();
}

function quantityIsValid (req, res, next) {
    const { data: {dishes} = {} } = req.body;
    
    for (const dish of dishes) {
        if(!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            next({
                status:400,
                message: `quantity must be valid for dish ${dish.id}: ${dish.quantity}`
            });
        }
    }
    next()
}

function orderExists (req, res, next) {
    const {orderId} = req.params;
    const foundOrder = orders.find((order) => order.id === String(orderId));
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
}

function statusIsValid (req, res, next) {
    const {data: {status} ={}} = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if( !validStatus.includes(status)) {
        next({
            status: 400,
            message: `Value of the 'status' property must be one of ${validStatus}.`
        });
    }
    next();
}


function updateStatusVerification (req, res, next) {
    const {data: {status} ={}} = req.body;
    if (status === "delivered") {
        next({
            status: 400,
            message: `Cannot update a delivered order.`
        });
    } 
    next();
};

function updateIdVerification(req, res, next){
    const {orderId} = req.params;
    const { data: {id} = {} } = req.body;
    if (!id) {
        next();
    }
    if (id !== orderId) {
        next({
            status: 400,
            message: `The order id must match the original: ${id}`
        })
    }
    next();
}

function deleteStatusVerification(req, res, next) {
    const order = res.locals.order;
    if (order.status !== "pending") {
        next({
            status: 400,
            message: `An order cannot be deleted unless it is pending.`
        })
    }
    next()
}
 
function read (req, res) {
    res.json({ data: res.locals.order });
}

function update (req, res) {
    const order = res.locals.order
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

function destroy(req, res, next) {
    const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));

    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        deliverIsValid,
        mobileIsValid,
        dishesIsValid,
        quantityIsValid,
        create
    ],
    list,
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        bodyDataHas("dishes"),
        deliverIsValid,
        mobileIsValid,
        dishesIsValid,
        quantityIsValid,
        statusIsValid,
        updateStatusVerification,
        updateIdVerification,
        update
    ],
    delete: [
        orderExists,
        deleteStatusVerification,
        destroy,
    ]

}