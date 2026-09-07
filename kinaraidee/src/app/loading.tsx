export default function Loading() {
  return <div className="animate-pulse"><div className="skeleton h-9 w-64 rounded-xl" /><div className="skeleton mt-3 h-5 w-96 max-w-full rounded-lg" /><div className="mt-8 grid gap-5 lg:grid-cols-3"><div className="skeleton h-72 rounded-[30px] lg:col-span-2" /><div className="skeleton h-72 rounded-[30px]" /></div><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-52 rounded-[26px]" />)}</div></div>;
}
