// 在现代前端应用中，几乎每个组件都需要进行异步数据请求。
// 为了避免在每个组件中重复编写 useState、useEffect 来处理加载中 (loading)、错误 (error)、数据 (data) 的状态，
// 我们通常会封装一个自定义的 useRequest Hook 来统一处理这些逻辑。

// 题目要求
// 请你使用 React + TypeScript 实现一个自定义 Hook useRequest。

// 基础功能
// 该 Hook 接收一个异步函数（例如：api.getUserInfo）作为参数。
// 该 Hook 返回一个对象，包含以下状态：
// data: T | null - 请求成功后返回的数据。
// loading: boolean - 请求是否正在进行中。
// error: Error | null - 请求失败后的错误对象。
// 该 Hook 在组件首次挂载时，应自动执行传入的异步函数。当异步函数改变时，应当重新执行。
import { useState, useEffect } from 'react';

interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const useRequest = <T>(task: () => Promise<T>): RequestState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // 初始设为 true 更符合逻辑
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      // 每次开始新请求前，重置状态
      setLoading(true);
      setError(null);

      try {
        const result = await task();
        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          // 安全地处理 unknown 类型的错误
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // 清理函数：防止组件卸载后执行赋值
    return () => {
      isCancelled = true;
    };
  }, [task]);

  return { data, loading, error };
};