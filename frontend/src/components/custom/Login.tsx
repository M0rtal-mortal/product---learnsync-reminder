import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff, CalendarDays, Loader2 } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data?.token) {
        login(res.data.token);
        toast.success('登录成功', { description: `欢迎回来，${res.data.user?.name || ''}` });
        navigate('/', { replace: true });
      } else {
        setError(res.message || '邮箱或密码错误');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.955_0.008_240)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[oklch(0.28_0.07_240)] rounded-xl flex items-center justify-center shadow-lg">
              <CalendarDays className="w-7 h-7 text-[oklch(0.78_0.15_75)]" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-[oklch(0.28_0.07_240)] font-serif">CampusSync</h1>
              <p className="text-xs text-[oklch(0.48_0.05_240)] tracking-widest uppercase">学习日程提醒系统</p>
            </div>
          </div>
          <p className="text-[oklch(0.48_0.05_240)] text-sm">登录您的账户，开始管理学习日程</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_10px_24px_-3px_rgb(30_58_95_/_0.15)] p-8">
          <h2 className="text-xl font-bold text-[oklch(0.12_0.025_240)] mb-6 font-serif">账户登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@university.edu.cn"
                className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm text-[oklch(0.12_0.025_240)] placeholder-[oklch(0.48_0.05_240)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 pr-11 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm text-[oklch(0.12_0.025_240)] placeholder-[oklch(0.48_0.05_240)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.28_0.07_240)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] shadow-md disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[oklch(0.48_0.05_240)]">
              还没有账户？{' '}
              <Link to="/signup" className="font-semibold text-[oklch(0.28_0.07_240)] hover:underline">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[oklch(0.48_0.05_240)] mt-6">
          © 2026 CampusSync · 学习日程提醒系统
        </p>
      </div>
    </div>
  );
};

export default Login;
