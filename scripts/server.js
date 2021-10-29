const express = require('express');
const DB = require('./DBCon');
const fs = require("fs")
const path = require("path");
const request = require('request');
const connection = DB.connection();
const app = express();


app.use(express.json())
app.use(express.urlencoded({ extended: false }));
//set the cross-origin
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
})

app.post("/listContainers", (req, res) => {
    DB.insert(connection, "SELECT * FROM containers WHERE isActive = 1", null, (data, err) => {
        if (err) res.status(500).send(err);
        DB.insert(connection, "SELECT * FROM AZ", null, (data1, err) => {
            if (err) res.status(500).send(err);
            res.status(200).send({
                containers: data,
                az: data1
            });
        })

    });
})

app.post("/listDisactiveContainers", (req, res) => {
    const currentPage = Number(req.body.currentPage) - 1;
    const pageSize = 15
    DB.insert(connection, "SELECT * FROM containers WHERE isActive = 0 LIMIT ?,?", [currentPage * pageSize, pageSize], (data, err) => {
        if (err) res.status(500).send(err)
        DB.insert(connection, "SELECT ceil(count(*) / ?) totalPage FROM containers WHERE isActive = 0 and (SELECT isPresaleEnded FROM AZ) = 1", pageSize, (data1, err) => {
            if (err) res.status(500).send(err);
            res.status(200).send({
                disactiveContainers: data,
                totalDisactiveCount: data1
            });
        })
    })
})

app.post('/lastContainerId', (req, res) => {
    DB.insert(connection, "SELECT MAX(id) maxId FROM containers", null, (data, err) => {
        if (err) res.status(500).send(err)
        res.status(200).send(data);
    })
})

app.post("/updateContainers", (req, res) => {
    let amount = Number(req.body.amount);
    let id = req.body.id;
    let container = JSON.parse(req.body.container);
    if (container.amount + amount >= container.totalAmount) {
        amount = container.totalAmount - container.amount
    }
    DB.insert(connection, "UPDATE containers SET amount = amount + ? WHERE id = ?", [amount, id], (data, err) => {
        if (err) res.status(500).send(err);
        res.status(200).send({ code: 1, amount: container.amount })
    })
})

app.post("/addContainer", (req, res) => {
    let container = JSON.parse(req.body.container);
    let data = require("./data.json");
    let containerIsAdd = data.containerIsAdd;
    let containerAddCount = data.containerAddCount;
    console.log(container);
    try {
        console.log(containerIsAdd, data.containerAddCount)
        if (containerIsAdd[container.id - 16] != true) {
            DB.insert(connection, "INSERT INTO containers VAlUE(?,?,?,?,?,?)", [
                container.id,
                container.address,
                container.amount,
                container.totalAmount,
                1,
                0
            ], (data, err) => {
                if (err) res.status(500).send(err)
                containerIsAdd.push(true);
                containerAddCount++;
                DB.insert(connection, "UPDATE az SET purchasedContainerNum = purchasedContainerNum + 1", null, (data1, err) => {
                    if (err) res.status(500).send(err);
                    fs.writeFileSync(path.resolve(__dirname, "./data.json"), JSON.stringify({
                        containerIsAdd: containerIsAdd,
                        containerAddCount: containerAddCount
                    }))
                    res.status(200).send(data1);
                })
            })
        } else {
            res.status(200).send("no")
        }

    } catch (error) {
        console.log(error)
    }

})

app.post("/setActiveById", (req, res) => {
    let id = req.body.id;
    DB.insert(connection, "UPDATE containers SET isActive = 0 WHERE id = ?", id, (data, err) => {
        if (err) res.status(500).send(err);
        res.status(200).send("success");
    })
})

app.post("/getContainerById", (req, res) => {
    const id = req.body.id;
    DB.insert(connection, "SELECT * FROM containers WHERE id = ?", id, (data, err) => {
        if (err) res.status(500).send(err);
        res.status(200).send(data);
    })
})

app.post("/setAllContainerActive", (req, res) => {
    DB.insert(connection, "UPDATE containers SET isActive = 1", null, (data, err) => {
        if (err) res.status(500).send(err);
        DB.insert(connection, "UPDATE az SET isPresaleEnded = 1, purchasedContainerNum = (SELECT count(*) FROM containers WHERE isActive = 1)", null, (data, err) => {
            if (err) res.status(500).send(err);
            res.status(200).send("success");
        })
    })

})



// remint
app.post("/filterTraits", (req, res) => {
    let filterTraits = JSON.parse(req.body.filterTraits);
    let currentPage = req.body.currentPage;
    let pageSize = 30;
    let sqlStr = "";
    let sqlParam = [];
    // console.log(filterTraits)
    for (let i = 0; i < filterTraits.length; i++) {
        let trait = filterTraits[i];
        console.log(trait)
        if (trait != null) {
            switch (i) {
                case 0:
                    sqlStr += "bgColor=? and "
                    break;
                case 1:
                    sqlStr += "body=? and ";
                    break;
                case 2:
                    sqlStr += "mouth=? and ";
                    break;
                case 3:
                    sqlStr += "eyes=? and ";
                    break;
                case 4:
                    sqlStr += "head=? and ";
                    break;
                case 5:
                    sqlStr += "neck=? and ";
                    break;
                case 6:
                    sqlStr += "clothing=? and ";
                    break;
                case 7:
                    sqlStr += "earring=? and ";
                    break;
                case 8:
                    sqlStr += "eyewear=? and ";
                    break;
                default:
                    break;
            }
            sqlParam.push(Number(trait.split("_")[1]))
        }
    }
    if (sqlStr.length != 0) {
        sqlStr += ";"
        sqlStr = "WHERE " + sqlStr.split("and ;")[0] + " LIMIT ?,?;";
    } else {
        sqlStr = sqlStr + "LIMIT ?,?;";
    }

    console.log(sqlStr)
    sqlParam.push(currentPage * pageSize, pageSize)
    DB.insert(connection, "SELECT * FROM zombies " + sqlStr, sqlParam, (data, err) => {
        if (err) res.status(500).send(err)
        DB.insert(connection, "SELECT count(*) totalZombies FROM zombies " + sqlStr, sqlParam, (data1, err) => {
            if (err) res.status(500).send(err)
            res.status(200).send({
                zombies: data,
                totalZombies: data1
            })
        })

    })
})

app.get("/listAllRemintZombie", (req, res) => {
    const currentPage = Number(req.query.currentPage);
    const pageSize = 30;
    DB.insert(connection,
        "SELECT * FROM zombies LIMIT ?,?",
        [currentPage * pageSize, pageSize],
        (data, err) => {
            if (err) res.status(500).send(err);
            DB.insert(connection, "SELECT COUNT(*) totalZombies FROM zombies ", null,
                (totalZombies, err) => {
                    if (err) res.status(500).send(err);
                    res.status(200).send({
                        zombies: data,
                        totalZombies: totalZombies
                    })
                })

        })
})

app.post("/updateRemintZombie", (req, res) => {
    const oldZombieId = req.body.oldZombieId;
    const newZombieId = req.body.newZombieId;
    console.log(oldZombieId, newZombieId)
    DB.insert(connection, "UPDATE zombies SET isRemint = 1 WHERE zId = ?", newZombieId, (data, err) => {
        DB.insert(connection, "UPDATE zombies SET isRemint = 0 WHERE zId = ?", oldZombieId, (data1, err) => {
            if (err) res.status(500).send(err);
            res.status(200).send("success")
        })

    })
})

app.post("/queryCIDFromMysql", (req, res) => {
    const correspondingOriginalSequenceIndex = req.body.correspondingOriginalSequenceIndex;
    DB.insert(connection, "SELECT cid FROM cids WHERE cidId = ?", correspondingOriginalSequenceIndex, (data, err) => {
        if (err) res.status(500).send(err);
        res.status(200).send(data)
    })
})


app.get('/cmc', (req, res) => {
    const API_Key = '9a47f5e9-2596-4649-8d7d-8cd0ffa3eb61';
    request(
        {
            url: `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=5&convert=USD`,
            headers: {
                "X-CMC_PRO_API_KEY": API_Key
            }
        },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    ).end("xxx")
});

app.listen(3001, () => {
    console.log('listening in 3001 port....')
});