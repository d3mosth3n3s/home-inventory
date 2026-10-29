import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getItems, getSummary } from "../api";

const ItemsContext = createContext(null);

export function ItemsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, total_value: 0 });

  const loadItems = useCallback(() => {
    getItems()
      .then((res) => setItems(res.data))
      .catch(console.error);
    getSummary()
      .then((res) => setSummary(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <ItemsContext.Provider value={{ items, summary, loadItems }}>
      {children}
    </ItemsContext.Provider>
  );
}

export const useItems = () => useContext(ItemsContext);
