const express = require("express");
const router = express.Router();
const Product = require("../schema/product");

router.get('/getData', async (req, res) => {
  try {
    const { search, month } = req.query;

    // Build the base query object
    let query = {};

    // If search is provided, filter by title, description, or category
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },  // Case-insensitive search for title
        { description: { $regex: search, $options: 'i' } },  // Case-insensitive search for description
        { category: { $regex: search, $options: 'i' } },  // Case-insensitive search for category
      ];

      // Optionally, if price search is required and the user provides a numeric value
      if (!isNaN(search)) {
        query.$or.push({ price: { $lte: parseFloat(search) } });  // Search price less than or equal to given value
      }
    }

    // If month is provided, filter by the month of the sale date
    if (month) {
      const monthNumber = parseInt(month, 10);
      if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({ message: 'Invalid month provided. It must be between 1 and 12.' });
      }

      // Add the filter to the query for dateOfSale based on the provided month
      query.dateOfSale = {
        $gte: new Date(`2021-${monthNumber.toString().padStart(2, '0')}-01T00:00:00Z`),
        $lt: new Date(`2021-${(monthNumber + 1).toString().padStart(2, '0')}-01T00:00:00Z`),
      };
    }

    // Search the database with the constructed query (if any filters are applied)
    const products = await Product.find(query);

    if (products.length > 0) {
      res.json(products);
    } else {
      res.status(404).json({ message: 'No products found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Route to get sales statistics for a selected month
router.get("/stats", async (req, res) => {
  const { month, year } = req.query; // Take month and year from query parameters

  // Validate month and year input
  const monthInt = parseInt(month);
  const yearInt = parseInt(year);

  if (!month || monthInt < 1 || monthInt > 12 || !year) {
    return res
      .status(400)
      .json({ error: "Please provide a valid month (1-12) and year." });
  }

  try {
    // Aggregate statistics, converting `dateOfSale` string to Date type within the pipeline
    const [stats] = await Product.aggregate([
      {
        $addFields: {
          dateOfSale: { $toDate: "$dateOfSale" }, // Convert to date within the pipeline
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateOfSale" }, monthInt] },
              { $eq: [{ $year: "$dateOfSale" }, yearInt] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: {
            $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] },
          },
          totalSoldItems: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
          totalNotSoldItems: {
            $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
          },
        },
      },
    ]);

    // Send response with statistics, ensuring no data errors
    res.status(200).json({
      totalSaleAmount: stats ? stats.totalSaleAmount : 0,
      totalSoldItems: stats ? stats.totalSoldItems : 0,
      totalNotSoldItems: stats ? stats.totalNotSoldItems : 0,
    });
  } catch (err) {
    console.error("Error fetching monthly statistics:", err);
    res.status(500).json({ error: "Failed to fetch monthly statistics." });
  }
});


// Route to get price range data for a bar chart for a selected month
router.get('/price', async (req, res) => {
  const { month, year } = req.query; // Take both month and year from the query parameters

  // Validate month and year inputs
  const monthInt = parseInt(month);
  const yearInt = parseInt(year);

  if (!month || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({ error: 'Please provide a valid month (1-12).' });
  }

  if (!year || isNaN(yearInt) || yearInt < 1900 || yearInt > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Please provide a valid year.' });
  }

  try {
      // Aggregate statistics for each price range
      const stats = await Product.aggregate([
          {
              $addFields: {
                  dateOfSale: { $toDate: "$dateOfSale" } // Convert dateOfSale to Date type
              }
          },
          {
              $match: {
                  $expr: { 
                      $and: [
                          { $eq: [{ $month: "$dateOfSale" }, monthInt] },
                          { $eq: [{ $year: "$dateOfSale" }, yearInt] } 
                      ] 
                  } // Match based on both month and year
              }
          },
          {
              $group: {
                  _id: null,
                  range_0_100: { $sum: { $cond: [{ $and: [{ $gte: ["$price", 0] }, { $lte: ["$price", 100] }] }, 1, 0] } },
                  range_101_200: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 100] }, { $lte: ["$price", 200] }] }, 1, 0] } },
                  range_201_300: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 200] }, { $lte: ["$price", 300] }] }, 1, 0] } },
                  range_301_400: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 300] }, { $lte: ["$price", 400] }] }, 1, 0] } },
                  range_401_500: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 400] }, { $lte: ["$price", 500] }] }, 1, 0] } },
                  range_501_600: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 500] }, { $lte: ["$price", 600] }] }, 1, 0] } },
                  range_601_700: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 600] }, { $lte: ["$price", 700] }] }, 1, 0] } },
                  range_701_800: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 700] }, { $lte: ["$price", 800] }] }, 1, 0] } },
                  range_801_900: { $sum: { $cond: [{ $and: [{ $gt: ["$price", 800] }, { $lte: ["$price", 900] }] }, 1, 0] } },
                  range_901_above: { $sum: { $cond: [{ $gt: ["$price", 900] }, 1, 0] } }
              }
          }
      ]);

      // Format response with default 0 for empty results
      res.status(200).json({
          priceRanges: {
              "0-100": stats[0]?.range_0_100 || 0,
              "101-200": stats[0]?.range_101_200 || 0,
              "201-300": stats[0]?.range_201_300 || 0,
              "301-400": stats[0]?.range_301_400 || 0,
              "401-500": stats[0]?.range_401_500 || 0,
              "501-600": stats[0]?.range_501_600 || 0,
              "601-700": stats[0]?.range_601_700 || 0,
              "701-800": stats[0]?.range_701_800 || 0,
              "801-900": stats[0]?.range_801_900 || 0,
              "901-above": stats[0]?.range_901_above || 0
          }
      });
  } catch (err) {
      console.error('Error fetching price range statistics:', err);
      res.status(500).json({ error: 'Failed to fetch price range statistics.' });
  }
});


// Route to get category distribution for pie chart for a selected month
router.get('/category', async (req, res) => {
  const { month } = req.query; // Take month as input from the query string

  // Validate month input
  const monthInt = parseInt(month);
  if (!month || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({ error: 'Please provide a valid month (1-12).' });
  }

  try {
      // Aggregate category statistics for the specified month
      const stats = await Product.aggregate([
          {
              $addFields: {
                  dateOfSale: { $toDate: "$dateOfSale" } // Convert dateOfSale to Date type
              }
          },
          {
              $match: {
                  $expr: { $eq: [{ $month: "$dateOfSale" }, monthInt] } // Match based on month only
              }
          },
          {
              $group: {
                  _id: "$category",
                  itemCount: { $sum: 1 }
              }
          },
          {
              $project: {
                  category: "$_id",
                  itemCount: 1,
                  _id: 0
              }
          }
      ]);

      // Prepare the response with default categories if not present
      const categories = ["men's clothing", "women's clothing", "electronics", "jewelry"];
      const categoryStats = categories.map(cat => {
          const found = stats.find(s => s.category === cat);
          return { category: cat, itemCount: found ? found.itemCount : 0 };
      });

      res.status(200).json(categoryStats);
  } catch (err) {
      console.error('Error fetching category statistics:', err);
      res.status(500).json({ error: 'Failed to fetch category statistics.' });
  }
});


module.exports = router;
