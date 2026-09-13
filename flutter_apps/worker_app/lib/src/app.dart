import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/screens/auth/login_screen.dart';
import 'src/screens/home/dashboard_screen.dart';
import 'src/screens/home/jobs_list_screen.dart';
import 'src/screens/home/schedule_screen.dart';
import 'src/screens/home/settings_screen.dart';
import 'src/screens/profile/profile_screen.dart';

class KaaryaWorkerApp extends ConsumerWidget {
 const KaaryaWorkerApp({super.key});

 @override
 Widget build(BuildContext context, WidgetRef ref) {
 return MaterialApp(
 title: 'Kaarya Worker',
 debugShowCheckedModeBanner: false,
 theme: ThemeData(
 colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFef4d23)),
 useMaterial3: true,
 ),
 home: const LoginScreen(),
 routes: {
 '/dashboard': (context) => const DashboardScreen(),
 '/jobs': (context) => const JobsListScreen(),
 '/schedule': (context) => const ScheduleScreen(),
 '/profile': (context) => const ProfileScreen(),
 '/settings': (context) => const SettingsScreen(),
 },
 );
 }
}
