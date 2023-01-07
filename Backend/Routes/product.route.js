const express = require("express");
const productsRoute = express.Router();
const { productsModel } = require("../Models/Products.model");
const { sortBy } = require("lodash");
productsRoute.get("/:path", async (req, res) => {
    console.log(req.params.path);
    const pathname = req.params.path
    const param = req.query
    console.log(req.query)
    const page = +(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit
    let arr = [{ category: pathname }]
    let q = {}
    let sort_by = {}
    for (let k in param) {
        if (param[k] != "null") {
            q[k] = param[k]
        }
    }
    for (let k in q) {
        if (k == "price") {
            let [min, max] = q[k].split("-").map(Number)
            arr.push({ price: { $gt: min } })
            arr.push({ price: { $lt: max } })
        } else if (k == "rating") {
            const rating = +(q[k])
            arr.push({ rating: { $gte: rating } })
        } else if (k == "sortBy") {
            sort_by = { price: q[k] }
        } else if (k == "discount") {
            const discount = +q[k]
            arr.push({
                $expr: {
                    $gt: [{ $floor: { $multiply: [{ $divide: [{ $subtract: ["$mrp", "$price"] }, "$mrp"] }, 100] } }, discount]
                }
            })
        }
    }
    // console.log(sort_by)

    try {
        const products = await productsModel.find({ $and: arr }).sort(sort_by).skip(skip).limit(limit);
        const total=await productsModel.countDocuments({ $and: arr })
        res.send({data:products,total:total,limit:20})
        res.end()
    } catch (error) {
        console.log(error)
        res.send({ "msg": "something went wrong" })
    }
})

productsRoute.get("/:path/:details/:_id", async (req, res) => {
    const category = req.params.path;
    const _id = req.params._id;

    try {
        const data = await productsModel.findOne({$and:[{category:category},{ _id: _id }]})
        res.send(data)
    } catch (err) {
        console.log(err);
        req.send({ "msg": "Something went wrong" })
    }
})


module.exports = { productsRoute }
