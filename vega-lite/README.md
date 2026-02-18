# Assignment 3: Introduction to Data Visualization with Vega-Lite
**Due Date:** February 16th, 11:55 PM

[Link to Assignment on GitHub](https://github.com/SIAT-IAT-355/A3-Intro-to-vegalite)

## Objective

In this assignment, you will create data visualizations using **Vega-Lite**. You will explore video game sales data and produce insightful visualizations to analyze trends, relationships, and patterns. The goal is to apply your knowledge of visualization design principles and get hands-on experience with Vega-Lite.

### Getting Started with Vega-Lite
- You will use the **`dataset/videogames_wide.csv`** and **`dataset/videogames_long.csv`** for this assignment. Both datasets contain the same data, but one of them makes your life easier. Choose the dataset that best suits your needs.


### What you are expected do to:

1. **Describe the dataset**: Summarize the data and variables to understand the context of the visualizations.
2. **Create visualizations and embed them in your website**: Design multiple visualizations to explore patterns in the data.
3. **Describe why your visualization choices were made**: Explain the reasoning behind your design choices.


### The Dataset
The dataset is a collection of video game sales data, with the following columns:

1. **Name**: The title of the video game.
2. **Platform**: The gaming platform on which the game was released (e.g., Wii, NES).
3. **Year**: The year the game was released.
4. **Genre**: The genre of the video game (e.g., Sports, Platform, Racing).
5. **Publisher**: The publisher of the game (e.g., Nintendo).
6. **NA_Sales**: Sales in North America (in millions of units).
7. **EU_Sales**: Sales in Europe (in millions of units).
8. **JP_Sales**: Sales in Japan (in millions of units).
9. **Other_Sales**: Sales in other regions (in millions of units).
10. **Global_Sales**: Total global sales (in millions of units).


### 1. Describe the Data
For each variable in the dataset, describe the **data type** and provide a summary of the key statistics:
- Data types include categories such as numerical, categorical, ordinal, etc.
- Summarize insights like the average global sales, most frequent genres, most popular platforms, and anything else you find significant. A suggested pattern is what comes below:
  - Central Tendency:
    - Mean: The average of the numbers. 
    - Median: The middle number in a sorted list; less affected by extreme values. 
    - Mode: The most frequently occurring number(s). 
  - Spread/Variability:
    - Range: The difference between the highest and lowest values. 
    - Standard Deviation: Measures how spread out the data is from the mean. 
  - **NOTE:** You are not limited to following this pattern, and we encourage you to have your own type of storytelling. For instance, you can write about how the dataset was different from or aligned with your expectations or intuition.
 
### 2. Create 4 Visual Explorations Using Vega-Lite

- **Visualization 1**: **Global Sales by Genre and Platform**
  - Create a visualization to explore global sales by genre and platform.
  - **Reflection**: What trends do you notice? What’s interesting in the data? Are there certain platforms or genres that dominate the sales?

- **Visualization 2**: **Sales Over Time by Platform and Genre**
  - Visualize sales trends over time, focusing on platforms and genres.
  - **Reflection**: How have video game sales changed for different platforms, genres, and publishers?

- **Visualization 3**: **Regional Sales vs. Platform**
  - Compare the sales between different regions (NA, EU, JP, and Others) by platform.
  - **Reflection**: Do you notice any regional preferences or patterns? Which platforms are more popular in specific regions?

- **Visualization 4**: **Tell Us a Visual Story**
  - Now that you’ve explored the dataset, create a visualization that highlights a pattern or story you find interesting.
  - **Reflection**: This is intentionally open-ended. Focus on a specific area that piques your interest, such as sales trends in Japan, a focus on specific publishers, or how certain genres perform across regions. Feel free to get creative!
 
- **Note:** :For each of these 4 visualizations, we have already defined the overall topic.  
You need to define two precise questions/prompts for each one and then create a visualization for each.  

    For example, Visualization 1 says to create a visualization about **Global Sales by Genre and Platform**.  
    Your questions could be:  
    - How much total sales have a specific group of genres achieved across all platforms?  
    - Or: Which genre has the highest sales on a particular group of platforms?

 ### 3. Describe Your Design Choices
For each of your visualizations, briefly describe why you chose the specific visualization type (what made you curious/interested), how it helps convey the data effectively, and any interesting design choices you made.

### 4. Submission Instructions

**Your submission should include these**:
  1. **Website Link**: 
    - You will create and deliver your visualizations on your website using **HTML, CSS, and JavaScript**. You can explore and create your visualizations in **Observable**. We suggest that you add it to the website you created for your second assignment. Simply create a new page in that repository.
    - Submit the **link** to the webpage you have created on your website (no link to the repository itself).
  2. **PDF Report**:
    - Submit a PDF document that describes your design choices for each visualization. Reflect on the decisions you made, based on the lectures and principles covered in class.
    - Your reflection must include these:
      - Why did you choose this specific prompt? What was interesting?
      - What do you understand from the visualization? Are there any patterns/insights?
      - Did you face any challenges while creating this visualization?  
      - The PDF should include the rationale behind your design choices.
    - **PDF Report:** `IAT355_Assignment3_FirstNameLastName.pdf`
  3. **Video Report:**
    - Submit a short video (no longer than 6 minutes) explaining your findings in this project:
      - Walk through your visualizations to show your final work.
      - Explain how you created each visualization, including any challenges you encountered.
      - Describe the key insights you learned about the given dataset from completing this assignment.
      - This video presentation does not have to be anything fancy. **Make sure you're audible**.
    - **Note:** This is to ensure you have understood what you have done along the way. You might ask AI for help, but we don't want you to just copy-paste everything. 
     

### Tips:
- Use the provided **helper files** (`index.html`, `style.css`, `vis.js`) to kickstart your project.
- Feel free to ask questions on Discord and Google how to do things.


### You can explore **Vega-Lite** through the following resources:

- **UW Vega-Lite Course**: You can learn most things about Vega-Lite from this comprehensive [UW Vega-Lite course on Observable](https://observablehq.com/@jonfroehlich/observable-tutorial?collection=@jonfroehlich/intro-to-vega-lite).
  
- **Vega-Lite Documentation**: The official [Vega-Lite Documentation](https://vega.github.io/vega-lite/docs/) is a great reference for understanding the available features and how to implement them.

- **Vega-Lite API Examples**: Explore some great Vega-Lite API examples in this [collection on Observable](https://observablehq.com/collection/@vega/vega-lite-api).

- **Visualization Curriculum Collection**: You can also explore another [amazing collection of lessons](https://observablehq.com/collection/@uwdata/visualization-curriculum) for deeper insights into visualization design.

