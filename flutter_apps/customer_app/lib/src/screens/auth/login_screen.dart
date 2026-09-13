import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
 const LoginScreen({super.key});

 @override
 State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
 final _phoneController = TextEditingController();
 final _otpController = TextEditingController();
 bool _otpSent = false;
 bool _loading = false;

 @override
 Widget build(BuildContext context) {
 return Scaffold(
 body: SafeArea(
 child: Padding(
 padding: const EdgeInsets.all(24.0),
 child: Column(
 crossAxisAlignment: CrossAxisAlignment.stretch,
 children: [
 const SizedBox(height: 80),
 Text(
 'Kaarya',
 textAlign: TextAlign.center,
 style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold),
 ),
 const SizedBox(height: 8),
 Text(
 'Book trusted professionals.',
 textAlign: TextAlign.center,
 style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.grey[600]),
 ),
 const Spacer(),
 if (!_otpSent) ...[
 TextField(
 controller: _phoneController,
 keyboardType: TextInputType.phone,
 decoration: const InputDecoration(
 labelText: 'Phone Number',
 hintText: '+91 98765 43210',
 prefixIcon: Icon(Icons.phone_outlined),
 ),
 ),
 const SizedBox(height: 16),
 FilledButton(
 onPressed: _loading ? null : _sendOtp,
 child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Send OTP'),
 ),
 ] else ...[
 TextField(
 controller: _otpController,
 keyboardType: TextInputType.number,
 maxLength: 6,
 decoration: const InputDecoration(
 labelText: 'Enter OTP',
 hintText: '123456',
 prefixIcon: Icon(Icons.lock_outline),
 ),
 ),
 const SizedBox(height: 16),
 FilledButton(
 onPressed: _loading ? null : _verifyOtp,
 child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Verify'),
 ),
 ],
 const SizedBox(height: 24),
 ],
 ),
 ),
 ),
 );
 }

 Future<void> _sendOtp() async {
 setState(() => _loading = true);
 await Future.delayed(const Duration(seconds: 1));
 setState(() { _otpSent = true; _loading = false; });
 }

 Future<void> _verifyOtp() async {
 setState(() => _loading = true);
 await Future.delayed(const Duration(seconds: 1));
 setState(() => _loading = false);
 // TODO: Navigate to home
 }
}
