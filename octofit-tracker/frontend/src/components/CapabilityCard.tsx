import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  load: () => Promise<T[]>;
  renderItem: (item: T) => ReactNode;
};

type RequestState<T> =
  | { status: 'loading' }
  | { status: 'success'; items: T[] }
  | { status: 'error' };

export function CapabilityCard<T>({ title, description, emptyMessage, load, renderItem }: Props<T>) {
  const [state, setState] = useState<RequestState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    load().then(
      (items) => {
        if (active) setState({ status: 'success', items });
      },
      () => {
        if (active) setState({ status: 'error' });
      },
    );
    return () => {
      active = false;
    };
  }, [load]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
    {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}. Please try again later.</p>}
    {state.status === 'success' && state.items.length === 0 && <p>{emptyMessage}</p>}
    {state.status === 'success' && state.items.length > 0 && <ul className="list-group list-group-flush">
      {state.items.map((item, index) => <li className="list-group-item" key={index}>{renderItem(item)}</li>)}
    </ul>}
  </div></section>;
}
