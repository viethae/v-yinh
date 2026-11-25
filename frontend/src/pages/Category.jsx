import Products from './Products';

export default function Category({ slug }) {
  return <Products key={slug} />;
}
