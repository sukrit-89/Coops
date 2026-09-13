import 'package:flutter/material.dart';
import 'src/screens/auth/login_screen.dart';
import 'src/screens/home/bookings_list_screen.dart';
import 'src/screens/home/booking_screen.dart';

class KaaryaCustomerApp extends StatelessWidget {
 const KaaryaCustomerApp({super.key});

 @override
 Widget build(BuildContext context) {
 return MaterialApp(
 title: 'Kaarya Customer',
 debugShowCheckedModeBanner: false,
 theme: ThemeData(
 colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFef4d23)),
 useMaterial3: true,
 ),
 home: const LoginScreen(),
 routes: {
 '/bookings': (context) => const BookingsListScreen(),
 '/new-booking': (context) => const BookingScreen(),
 },
 );
 }
}
