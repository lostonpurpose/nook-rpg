fetch("https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
