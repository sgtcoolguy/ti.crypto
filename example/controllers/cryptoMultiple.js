// This example demonstrates the usage of the crypto APIs to encrypt multiple blocks of data
//
// The general usage of the multiple crypt APIs is as follows:
//
// 1. Create a key using the crypto.createKey API
// 2. Create an initialization vector using the Ti.createBuffer API (if needed -- the default is a zero-filled vector)
// 3. Create a cryptor using the crypto.createCryptor API
// 4. To encrypt:
//    a. Set the operation to crypto.ENCRYPT (if not already set)
//    b. Create a buffer to hold all of the encrypted data
//    c. Create a buffer to receive the encrypted data (optionally, use the input buffer to contain the encrypted data)
//    d. Update the buffer containing the data to encrypt
//    e. Call the update method on the cryptor created in step 3
//    f. Append result to the buffer holding all of the encrypted data
//    g. Repeat d-f until all data has been encrypted
//    h. Call the final method on the cryptor created in step 3
//    i. Append result to the buffer holding all of the encrypted data
//    j. Call the release method on the cryptor created in step 3
// 5. To decrypt:
//    a. Set the operation to crypto.DECRYPT (if not already set)
//    b. Create a buffer to hold all of the decrypted data
//    c. Create a buffer to receive the decrypted data (optionally, use the input buffer to contain the decrypted data)
//    d. Update the buffer containing the data to decrypt
//    e. Call the update method on the cryptor created in step 3
//    f. Append result to the buffer holding all of the decrypted data
//    g. Repeat d-f until all data has been decrypted
//    h. Call the final method on the cryptor created in step 3
//    i. Append result to the buffer holding all of the decrypted data
//    j. Call the release method on the cryptor created in step 3

App.controllers.cryptoMultiple = function () {
	var API = {
		params: null,
		cryptor: null,
		key: null,
		initializationVector: null,
		plainTextField: null,
		cipherTextField: null,
		fixedBuffer: null,
		encryptionBuffer: null,
		
		init: function (params) {
			API.params = params;

			// For this example, create a key to use based on the key size for the selected algorithm
			// Keys can be defined using text strings ('value:') or hex values ('hexValue:')
			switch (params.keySize) {
				case 1:
					API.key = App.crypto.createKey({ hexValue: '11' });
					break;
				case 5:
					// Hex values can be separated by spaces for easier reading
					API.key = App.crypto.createKey({ hexValue: '00 11 22 33 44' });
					break;
				case 8:
					// Or, hex values can be specified as one single sequence of numbers
					API.key = App.crypto.createKey({ hexValue: '0011223344556677' });
					break;
				case 16:
					API.key = App.crypto.createKey({ hexValue: '001122334455667788990a0b0c0d0e0f' });
					break;
				case 24:
					API.key = App.crypto.createKey({ value: 'abcdefghijklmnopqrstuvwx' });
					break;
				case 32:
					API.key = App.crypto.createKey({ value: 'abcdefghijklmnopqrstuvwxyz012345' });
					break;
				case 128:
					API.key = App.crypto.createKey({ value: '00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222' });
					break;
				case 512:
					var string100 = '0000000000111111111122222222223333333333444444444455555555556666666666777777777788888888889999999999';
					API.key = App.crypto.createKey({ value: string100 + string100 + string100 + string100 + string100 + '012345678901' });
					break;
			};
			
			API.initializationVector = App.crypto.createBuffer({
				hexValue: "00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff"
			});
			
			API.cryptor = App.crypto.createCryptor({
				algorithm: params.algorithm,
				options: params.options,
				key: API.key,
				initializationVector: API.initializationVector
			});
			
			// Create a fixed size buffer to be used for encryption
			API.fixedBuffer = Ti.createBuffer();
			API.fixedBuffer.length = 1024;
			
			// Create the encryption buffer to hold the result
			API.encryptionBuffer = Ti.createBuffer();			
			
			// NOTE: Set resizeBuffer to false if you do not want the output buffer to be resized to fit the
			// size needed for encryption / decryption. In this example we are creating a fixed size buffer to
			// be reused each time that update is called in order to minimize memory reallocations.
			API.cryptor.resizeBuffer = false;
		},
		
		cleanup: function() {
			API.params = null;
			API.cryptor = null;
			API.key = null;
			API.initializationVector = null;
			API.plainTextField = null;
			API.cipherTextField = null;
			API.fixedBuffer = null;
			API.encryptionBuffer = null;
		},
		
		handleUpdate: function(e) {
			API.cryptor.operation = App.crypto.ENCRYPT;
			
			// Make sure to set the resizeBuffer flag to false since the decryption operation may have changed its value
			API.cryptor.resizeBuffer = false;
			
			// Create the buffer containing the original plain text that we want to encrypt
			var buffer = App.crypto.createBuffer({ value: API.plainTextField.value + '\n' });
			
			// For this example, use the same buffer for both input and output (in-place)
			// You can specify separate buffers for both input and output if desired
			var numBytes = API.cryptor.update(buffer, -1, API.fixedBuffer);
			
			// Append the result to our encryption buffer
			API.encryptionBuffer.append(API.fixedBuffer, 0, numBytes);
			
			if (numBytes < 0) {
				alert('Error occurred during encryption: ' + numBytes);
			} else {
				// Set the value of the encrypted text (base64 encoded for readability)
				API.cipherTextField.value = App.crypto.base64encode(API.encryptionBuffer);
			}
			
			// Clear the plain text field for the next update
			API.plainTextField.value = '';
			API.plainTextField.blur();
		},
	
		handleFinal: function(e) {
			// Make sure to set the resizeBuffer flag to false since the decryption operation may have changed its value
			API.cryptor.resizeBuffer = false;

			var numBytes = API.cryptor.final(API.fixedBuffer);
			if (numBytes > 0) {
				// Append the result to our encryption buffer
				API.encryptionBuffer.append(API.fixedBuffer, 0, numBytes);
				
				API.cipherTextField.value = App.crypto.base64encode(API.encryptionBuffer);
			}
			
			// We are done with this cryptor operation -- release it so it can be reused
			API.cryptor.release();
			
			// Fire off the decryption and display the result
			API.doDecryption();
			
			// Reset fields in case another encryption begins
			API.encryptionBuffer.clear();
			API.encryptionBuffer.release();
			API.cipherTextField.value = '';
		},
		
		doDecryption: function() {
			API.cryptor.operation = App.crypto.DECRYPT;
			
			// For this example, we want the decryption buffer to be auto-sized to hold the decrypted text
			API.cryptor.resizeBuffer = true;
			
			// Create the buffer to hold the decryption result and the cumulative decrypted text
			var decryptionBuffer = Ti.createBuffer();
			var decryptedText = Ti.createBuffer();
			
			// For this example we are providing both an input buffer and a separate output buffer
			var numBytes = API.cryptor.update(API.encryptionBuffer, -1, decryptionBuffer);
			if (numBytes > 0) {
				decryptedText.append(decryptionBuffer, 0, numBytes);
			}
			
			// Since we decrypted the entire encryption buffer in one call the only thing left to do is call final
			// to get any remaining data in the decryption buffer
			numBytes = API.cryptor.final(decryptionBuffer);
			if (numBytes > 0) {
				decryptedText.append(decryptionBuffer, 0, numBytes);
			}
			
			// We are done with this cryptor operation -- release it so it can be reused
			API.cryptor.release();
						
			Ti.UI.createAlertDialog({
				title: 'Decrypted Text',
				message: decryptedText.toString(),
				buttonNames: ['OK']
			}).show();
		},
		
		create: function(win) {
			win.title = API.params.title + ' - Multiple';
			
			win.add(Ti.UI.createLabel({
				text: 'Enter text to encrypt',
				textAlign: 'left',
				top: 10,
				left: 10,
				color: 'black',
				width: 'auto',
				height: 'auto'
			}));
			
			API.plainTextField = Ti.UI.createTextArea({
				value: 'Titanium Crypto Module',
				color: 'black',
				left: 10, right: 10, top: 4, height: 60,
				borderColor: 'gray',
				borderRadius: 8,
				borderWidth: 1,
				font: { fontSize: 14 }
			});
			win.add(API.plainTextField);
			
			var updateBtn = Ti.UI.createButton({
				title: 'Update',
				top: 10,
				width: 200,
				height: 40
			});
			win.add(updateBtn);
			
			win.add(Ti.UI.createLabel({
				text: 'Encrypted text (base64 encoded)',
				textAlign: 'left',
				top: 10,
				left: 10,
				color: 'black',
				width: 'auto',
				height: 'auto'
			}));
			
			API.cipherTextField = Ti.UI.createTextArea({
				backgroundColor: '#F0F0F0',
				editable: false,
				color: 'black',
				left: 10, right: 10, top: 14, height: 140,
				borderColor: 'gray',
				borderRadius: 8,
				borderWidth: 1,
				font: { fontSize: 14 }
			});
			win.add(API.cipherTextField);
			
			var finalBtn = Ti.UI.createButton({
				title: 'Final',
				top: 10,
				width: 200,
				height: 40
			});
			win.add(finalBtn);
			
			updateBtn.addEventListener('click', API.handleUpdate);
			finalBtn.addEventListener('click', API.handleFinal);
		}
	};
	
	return API;
}