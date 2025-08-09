import fs from 'fs';
import { parse } from 'csv-parse/sync';
const tasksCsv = fs.readFileSync('datasets/tasks.csv','utf-8');
const productsCsv = fs.readFileSync('datasets/products.csv','utf-8');
const productsV2Csv = fs.readFileSync('datasets/products_v2.csv','utf-8');
const tasks = parse(tasksCsv,{columns:true});
const products = parse(productsCsv,{columns:true});
const productsV2 = parse(productsV2Csv,{columns:true});
function productNameForTask(id, prods){
  const task = tasks.find(t => t.id === String(id));
  const product = prods.find(p => p.id === task.product_id);
  return {task: task.title, productName: product.name};
}
console.log('Before schema change', productNameForTask(1, products));
console.log('After schema change', productNameForTask(1, productsV2));
