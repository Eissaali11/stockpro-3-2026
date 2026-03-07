import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { loginSchema, type LoginRequest } from '@shared/schema';
import { User, Lock, Loader2, Package, TruckIcon, BarChart3, FileText, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import rasscoLogo from "@assets/39bff80c-2b7d-48a8-80ed-34b372af4da3_transparent_1762470013152.png";

export default function Login() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsSubmitting(true);
    try {
      const result = await login(data);
      
      if (result.success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${result.user?.fullName}`,
        });
        setLocation('/home');
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: result.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: error.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-12 w-12 animate-spin text-[#18B2B0] mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">جاري التحميل...</p>
        </motion.div>
      </div>
    );
  }

  const features = [
    {
      icon: Package,
      title: "إدارة المخزون الثابت والمتحرك",
      description: "تتبع دقيق لجميع الأصناف والمواد مع تحديثات فورية للكميات"
    },
    {
      icon: TruckIcon,
      title: "إدارة المستودعات",
      description: "نظام متقدم لإدارة المستودعات مع نظام الموافقات والتحويلات"
    },
    {
      icon: Users,
      title: "إدارة الفنيين",
      description: "متابعة شاملة لمخزون كل فني مع تنبيهات تلقائية عند النقص"
    },
    {
      icon: FileText,
      title: "التقارير والتصدير",
      description: "تقارير تفصيلية احترافية وتصدير Excel بتنسيق موحد ومنظم"
    },
    {
      icon: BarChart3,
      title: "لوحة المعلومات التحليلية",
      description: "رؤية شاملة للمخزون مع مؤشرات الأداء الرئيسية والإحصائيات"
    },
    {
      icon: Shield,
      title: "نظام الصلاحيات",
      description: "التحكم الكامل في الصلاحيات مع تسجيل كامل لجميع العمليات"
    }
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden" 
      dir="rtl"
      style={{
        backgroundImage: 'linear-gradient(135deg, #0b1d1f 0%, #12353a 45%, #0f2a2f 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Features */}
          <motion.div
            className="space-y-6 order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo - Desktop Only */}
            <motion.div
              className="hidden lg:flex justify-center lg:justify-start"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            >
              <motion.div
                className="relative"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#18B2B0]/30 blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Logo Container */}
                <motion.div
                  className="relative bg-white rounded-full shadow-2xl border-4 border-[#18B2B0]/50 w-32 h-32 flex items-center justify-center p-4"
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(24, 178, 176, 0.3)",
                      "0 0 40px rgba(24, 178, 176, 0.6)",
                      "0 0 20px rgba(24, 178, 176, 0.3)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img 
                    src={rasscoLogo} 
                    alt="RASSCO" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-right space-y-3"
            >
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                StockPro
              </h1>
              <p className="text-xl lg:text-2xl text-[#18B2B0] font-semibold">
                نظام إدارة المخزون الاحترافي
              </p>
              <p className="text-base lg:text-lg text-gray-300 leading-relaxed">
                حلول متقدمة لإدارة مخزون الفنيين والمستودعات
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              className="grid gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4 items-center bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="p-3 bg-[#18B2B0]/20 rounded-lg border border-[#18B2B0]/30 shrink-0">
                    <feature.icon className="w-6 h-6 text-[#18B2B0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base lg:text-lg mb-1">{feature.title}</h3>
                    <p className="text-gray-300 text-xs lg:text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center order-1 lg:order-2 w-full"
          >
            {/* Mobile Logo */}
            <motion.div
              className="lg:hidden mb-8 flex justify-center"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            >
              <motion.div
                className="relative"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#18B2B0]/30 blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* Logo Container */}
                <motion.div
                  className="relative bg-white rounded-full shadow-2xl border-4 border-[#18B2B0]/50 w-28 h-28 flex items-center justify-center p-3"
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(24, 178, 176, 0.3)",
                      "0 0 40px rgba(24, 178, 176, 0.6)",
                      "0 0 20px rgba(24, 178, 176, 0.3)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img 
                    src={rasscoLogo} 
                    alt="RASSCO" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            <Card className="w-full max-w-md bg-white/20 backdrop-blur-xl border-2 border-white/30 shadow-2xl">
              <CardHeader className="text-center pb-4 pt-8 space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-[#18B2B0] to-teal-600 rounded-full shadow-lg">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">تسجيل الدخول</h2>
                <p className="text-gray-200">مرحباً بك في نظام StockPro</p>
              </CardHeader>
              
              <CardContent className="pb-8 px-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-semibold">اسم المستخدم</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="أدخل اسم المستخدم"
                                className="pr-10 h-12 bg-white/90 border-gray-300 focus:border-[#18B2B0] focus:ring-[#18B2B0]"
                                disabled={isSubmitting}
                                data-testid="input-username"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-semibold">كلمة المرور</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="أدخل كلمة المرور"
                                className="pr-10 h-12 bg-white/90 border-gray-300 focus:border-[#18B2B0] focus:ring-[#18B2B0]"
                                disabled={isSubmitting}
                                data-testid="input-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-[#18B2B0] to-teal-600 hover:from-[#15a09e] hover:to-teal-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isSubmitting}
                      data-testid="button-login"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          جاري تسجيل الدخول...
                        </>
                      ) : (
                        'تسجيل الدخول'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Copyright */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-lg border border-white/20">
                <p className="text-white font-semibold text-sm mb-1">
                  جميع الحقوق محفوظة © 2024
                </p>
                <p className="text-[#18B2B0] font-bold text-base">
                  عيسى القحطاني
                </p>
                <a 
                  href="mailto:skrkhtan@gmail.com" 
                  className="text-gray-300 hover:text-white text-sm transition-colors duration-300 inline-block mt-1"
                >
                  skrkhtan@gmail.com
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
