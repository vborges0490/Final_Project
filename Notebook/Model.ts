{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 6,
   "id": "f906d8d4-4dd5-4a70-9608-b78c64af101b",
   "metadata": {},
   "outputs": [],
   "source": [
    "import tensorflow as tf\n",
    "from tensorflow.keras.datasets import fashion_mnist\n",
    "\n",
    "# Load the dataset\n",
    "(train_images, train_labels), (test_images, test_labels) = fashion_mnist.load_data()\n",
    "\n",
    "# Normalize the pixel values of the images to be between 0 and 1\n",
    "train_images = train_images.reshape((train_images.shape[0], 28, 28, 1))\n",
    "test_images = test_images.reshape((test_images.shape[0], 28, 28, 1))"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 7,
   "id": "5b731d0d-1296-4206-a497-f3f8a3851499",
   "metadata": {},
   "outputs": [
    {
     "name": "stderr",
     "output_type": "stream",
     "text": [
      "C:\\Users\\vborg\\Documents\\IronHack\\Class\\Week3\\Project\\Myproject\\Lib\\site-packages\\keras\\src\\layers\\convolutional\\base_conv.py:99: UserWarning: Do not pass an `input_shape`/`input_dim` argument to a layer. When using Sequential models, prefer using an `Input(shape)` object as the first layer in the model instead.\n",
      "  super().__init__(\n"
     ]
    }
   ],
   "source": [
    "model = tf.keras.Sequential([\n",
    "    tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),\n",
    "    tf.keras.layers.MaxPooling2D((2, 2)),\n",
    "    tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),\n",
    "    tf.keras.layers.MaxPooling2D((2, 2)),\n",
    "    tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),\n",
    "    tf.keras.layers.Flatten(),\n",
    "    tf.keras.layers.Dense(64, activation='relu'),\n",
    "    tf.keras.layers.Dropout(0.5),\n",
    "    tf.keras.layers.Dense(10, activation='softmax')\n",
    "])\n",
    "\n",
    "model.compile(optimizer='adam',\n",
    "              loss='sparse_categorical_crossentropy',\n",
    "              metrics=['accuracy'])"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 8,
   "id": "a9285499-35d2-4008-b30e-b959fd9aba47",
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "Epoch 1/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m9s\u001b[0m 4ms/step - accuracy: 0.5601 - loss: 1.6923\n",
      "Epoch 2/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.7968 - loss: 0.5575\n",
      "Epoch 3/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8430 - loss: 0.4360\n",
      "Epoch 4/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8600 - loss: 0.4009\n",
      "Epoch 5/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8715 - loss: 0.3551\n",
      "Epoch 6/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8778 - loss: 0.3343\n",
      "Epoch 7/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8869 - loss: 0.3184\n",
      "Epoch 8/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8895 - loss: 0.3026\n",
      "Epoch 9/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8948 - loss: 0.2915\n",
      "Epoch 10/10\n",
      "\u001b[1m1875/1875\u001b[0m \u001b[32m━━━━━━━━━━━━━━━━━━━━\u001b[0m\u001b[37m\u001b[0m \u001b[1m8s\u001b[0m 4ms/step - accuracy: 0.8975 - loss: 0.2777\n",
      "313/313 - 1s - 3ms/step - accuracy: 0.8891 - loss: 0.3289\n",
      "\n",
      "Test accuracy: 0.8891000151634216\n"
     ]
    }
   ],
   "source": [
    "model.fit(train_images, train_labels, epochs=10)\n",
    "\n",
    "test_loss, test_acc = model.evaluate(test_images,  test_labels, verbose=2)\n",
    "print('\\nTest accuracy:', test_acc)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 11,
   "id": "aad92167-da3a-40d5-812a-1a920ccdd70e",
   "metadata": {},
   "outputs": [],
   "source": [
    "model.save('vini_fashion_model.keras')"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Myproject",
   "language": "python",
   "name": "myproject"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.11.5"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
