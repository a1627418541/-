import { useState } from "react";
import Turnstile from "../components/Turnstile";
import { api } from "../services/api";

export default function TestTurnstilePage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      setResult("请先完成人机验证");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.request<{ success: boolean; error?: string }>(
        "/auth/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify({ token }),
        }
      );

      if (res.success) {
        setResult("验证成功！Turnstile 工作正常");
      } else {
        setResult(`验证失败: ${res.error || "未知错误"}`);
      }
    } catch (err: any) {
      setResult(`请求错误: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          机器人验证测试
        </h1>
        <p className="text-center text-gray-400 mb-8">
          测试 Cloudflare Turnstile 是否正常工作
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Turnstile onVerify={setToken} />

          {result && (
            <div
              className={`p-3 text-sm rounded-lg ${
                result.includes("成功")
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {result}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "验证中..." : "提交验证"}
          </button>
        </form>
      </div>
    </div>
  );
}
